import { ComputeOptions, evalExpr, OpType } from "../../core/_internal";
import { Iterator } from "../../lazy";
import { Any, AnyObject, Callback, Options, Predicate } from "../../types";
import {
  assert,
  ensureArray,
  filterMissing,
  has,
  intersection,
  isArray,
  isEmpty,
  isNil,
  isNumber,
  isObject,
  isOperator,
  MISSING,
  normalize,
  removeValue,
  resolve,
  resolveGraph,
  setValue,
  unique
} from "../../util/_internal";
import { validateProjection } from "./_internal";

const OP = "$project";

/**
 * Reshapes each document in the stream, such as by adding new fields or removing existing fields.
 * For each input document, outputs one document.
 *
 * See {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/project usage}.
 */
export function $project(
  coll: Iterator,
  expr: AnyObject,
  options: Options
): Iterator {
  if (isEmpty(expr)) return coll;
  const meta = validateProjection(expr, options);
  const handler = createHandler(expr, ComputeOptions.init(options), meta);
  return coll.map(handler);
}

// handler for transforming the 'target' object based on the 'current'.
type SelectorHandler = (_target: AnyObject, _current: AnyObject) => void;

/**
 * Creates a precompiled handler for projection operation.
 * @param expr  The projection expression
 * @param options The options
 * @param meta Metadata about the validated projection expression.
 * @returns
 */
function createHandler(
  expr: AnyObject,
  options: ComputeOptions,
  meta: {
    exclusions: string[];
    inclusions: string[];
    positional: number;
  }
): (_: AnyObject) => Any {
  const idKey = options.idKey;
  const { exclusions, inclusions } = meta;
  const handlers: Record<string, SelectorHandler> = {};
  const resolveOpts = {
    preserveIndex: "missing" as const
  };

  for (const k of exclusions) {
    handlers[k] = (t: AnyObject, _: AnyObject) => {
      removeValue(t, k, { descendArray: true });
    };
  }

  for (const selector of inclusions) {
    const v = resolve(expr, selector) ?? expr[selector];
    // get predicate for field if used as a positional projection "<array-selector>.$".
    if (selector.endsWith(".$") && v === 1) {
      // ensure there is query condition
      const cond: AnyObject = options?.local?.condition ?? {};
      assert(cond, `${OP}: positional operator '.$' requires array condition.`);
      const field = selector.slice(0, -2);
      handlers[field] = getPositionalFilter(field, cond, options);
    } else if (isArray(v)) {
      handlers[selector] = (t: AnyObject, o: AnyObject) => {
        options.update({ root: o });
        const newVal = v.map(e => evalExpr(o, e, options) ?? null);
        setValue(t, selector, newVal);
      };
    } else if (isNumber(v) || v === true) {
      handlers[selector] = (t: AnyObject, o: AnyObject) => {
        options.update({ root: o });
        const extractedVal = resolveGraph(o, selector, resolveOpts);
        mergeInto(t, extractedVal);
      };
    } else if (!isObject(v)) {
      handlers[selector] = (t: AnyObject, o: AnyObject) => {
        options.update({ root: o });
        const newVal = evalExpr(o, v, options);
        setValue(t, selector, newVal);
      };
    } else {
      // value is an object so must be an operator.
      const opKeys = Object.keys(v);
      assert(
        opKeys.length === 1 && isOperator(opKeys[0]),
        "Not a valid operator"
      );
      // handle operators
      const operator = opKeys[0];
      const opExpr = v[operator];

      // get the projection operator as used in Query.find() queries
      const fn = options.context.getOperator(OpType.PROJECTION, operator);

      // $slice can either be the projection operator or expression operator with different syntax
      const foundSlice = operator === "$slice";
      // when no projection operator or $slice expression operator: [<array-expression>, <number>, <number>]
      if (!fn || (foundSlice && !ensureArray(opExpr).every(isNumber))) {
        // handle expression operator
        handlers[selector] = (t: AnyObject, o: AnyObject) => {
          options.update({ root: o });
          const newval = evalExpr(o, v, options);
          setValue(t, selector, newval);
        };
      } else {
        // handle projection operator
        handlers[selector] = (t: AnyObject, o: AnyObject) => {
          options.update({ root: o });
          const newval = fn(o, opExpr, selector, options);
          setValue(t, selector, newval);
        };
      }
    }
  }

  const onlyIdKeyExcluded =
    exclusions.length === 1 && exclusions.includes(idKey);
  const noIdKeyExcluded = !exclusions.includes(idKey);
  const noInclusions = !inclusions.length;

  // We start with all the fields in the object and prune as we go for these cases.
  //  1) When the only projection is to exclude the ID_KEY (i.e. no explicit inclusions).
  //  2) When there are explicit exclusions but not just for the ID_KEY.
  const allKeysIncluded =
    (noInclusions && onlyIdKeyExcluded) ||
    (noInclusions && exclusions.length && !onlyIdKeyExcluded);

  return (o: AnyObject) => {
    const newObj: AnyObject = {};

    if (allKeysIncluded) Object.assign(newObj, o);

    // process each selector with their corresponding handler.
    for (const k in handlers) {
      handlers[k](newObj, o);
    }

    // filter out all missing values preserved to support correct merging if we explicitly included fields.
    if (!noInclusions) filterMissing(newObj);

    // if the ID key was not explicitly excluded, and does not exist in new object we always add it to the final result.
    if (noIdKeyExcluded && !has(newObj, idKey) && has(o, idKey)) {
      newObj[idKey] = resolve(o, idKey);
    }

    return newObj;
  };
}

const findMatches = (
  o: AnyObject,
  key: string,
  leaf: string,
  pred: Predicate
) => {
  let arr = resolve(o, key) as Any[];
  if (!isArray(arr)) arr = resolve(arr, leaf) as AnyObject[];
  assert(isArray(arr), `${OP}: field '${key}' must resolve to array`);
  const matches: number[] = [];
  // note: each value is passed in as an arary to support $elemMatch operator.
  for (let i = 0; i < arr.length; i++) {
    if (pred({ [leaf]: [arr[i]] })) matches.push(i);
  }
  return matches;
};

const complement = (p: Predicate) => ((e: AnyObject) => !p(e)) as Predicate;

const COMPOUND_OPS = { $and: 1, $or: 1, $nor: 1 } as const;

/**
 * Returns a callback that updates an object to select the first matching value.
 *
 * @param field The positional field from the projection expression excluding ".$" suffix.
 * @param condition The query condition expression in which to check for the 'field'.
 * @returns
 */
function getPositionalFilter(
  field: string,
  condition: AnyObject,
  options: ComputeOptions
): Callback<void, AnyObject> {
  // we must handle two cases of nested fields. e.g. "a.b.c" can be.
  //  1. {a:{b:[{c:1},{c:2}...]}}
  //  2. {a:{b:{c:[...]}}}
  // we split the selector into the (parent, leaf) eg. "a.b.c" -> ["a.b", "c"].
  // then we use the 'leaf' as the selector to the compiled predicate for the case of nested objects in array paths.
  // since we always need to send an object to the predicate, for non-objects we wrap in an object with the 'leaf' as the key.
  const stack: [string, Any, string?][] = Object.entries(condition).slice();
  const selectors: Record<"$and" | "$or", [string, Predicate, string][]> = {
    $and: [],
    $or: []
  };
  for (let i = 0; i < stack.length; i++) {
    const [key, val, op] = stack[i] as [string, Any, string];
    if (key === field || key.startsWith(field + ".")) {
      const normalizedExpr = normalize(val) as AnyObject;
      const operator = Object.keys(normalizedExpr)[0];
      const expr = normalizedExpr[operator];
      const fn = options.context.getOperator(
        OpType.QUERY,
        operator
      ) as Callback<Predicate>;
      const leaf = key.substring(key.lastIndexOf(".") + 1);
      const pred = fn(leaf, expr, options);
      if (!op || op === "$and") {
        // default for all query criteria
        selectors.$and.push([key, pred, leaf]);
      } else if (op === "$nor") {
        // handle $nor by inverting predicate for conjunction evaluation.
        selectors.$and.push([key, complement(pred), leaf]);
      } else if (op === "$or") {
        // must check these as a group to identify all matching indices
        selectors.$or.push([key, pred, leaf]);
      }
    } else if (isOperator(key)) {
      assert(
        !!COMPOUND_OPS[key as keyof typeof COMPOUND_OPS],
        `${OP}: '${key}' is not allowed in this context`
      );
      for (const item of val as AnyObject[]) {
        for (const k of Object.keys(item)) stack.push([k, item[k], key]);
      }
    }
  }

  const sep = field.lastIndexOf(".");
  const parent = field.substring(0, sep) || field;
  const leaf = field.substring(sep + 1);

  return (t: AnyObject, o: AnyObject) => {
    const matches: number[][] = [];
    for (const [key, pred, leaf] of selectors.$and) {
      matches.push(findMatches(o, key, leaf, pred));
    }

    if (selectors.$or.length) {
      const orMatches: number[] = [];
      for (const [key, pred, leaf] of selectors.$or) {
        orMatches.push(...findMatches(o, key, leaf, pred));
      }
      matches.push(unique(orMatches));
    }

    // matching index has passed all conditions
    const i = intersection(matches).sort()[0];
    let first = (resolve(o, field) as Any[])[i];
    if (parent != leaf && !isObject(first)) {
      first = { [leaf]: first };
    }
    setValue(t, parent, [first]);
  };
}

/** Merge input object into target object replacing all placeholder values. */
function mergeInto(target: Any, input: Any): Any {
  if (target === MISSING || isNil(target)) return input;
  if (isNil(input)) return target;
  // handle both arrays and objects
  const out = target as AnyObject;
  const src = input as AnyObject;
  for (const k of Object.keys(input as object)) {
    out[k] = mergeInto(out[k], src[k]);
  }
  return out;
}
