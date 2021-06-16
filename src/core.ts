import { Iterator } from "./lazy";
import {
  AnyVal,
  ArrayOrObject,
  Callback,
  Collection,
  RawArray,
  RawObject,
} from "./types";
import {
  assert,
  cloneDeep,
  has,
  HashFunction,
  into,
  isNil,
  isObject,
  isObjectLike,
  isOperator,
  isString,
  resolve,
} from "./util";

/**
 * Resolves the given string to a Collection.
 * This is useful for operators that require a second collection to use such as $lookup and $out.
 * The collection is not cached and will be resolved each time it is used.
 */
export type CollectionResolver = (name: string) => Collection;

/** Specification for collation options */
export interface CollationSpec {
  readonly locale: string;
  readonly caseLevel?: boolean;
  readonly caseFirst?: string;
  readonly strength?: number;
  readonly numericOrdering?: boolean;
  readonly alternate?: string;
  readonly maxVariable?: string; // unsupported
  readonly backwards?: boolean; // unsupported
}

/**
 * Generic options interface passed down to all operators
 */
export interface Options extends RawObject {
  readonly idKey?: string;
  readonly collation?: CollationSpec;
  readonly hashFunction?: HashFunction;
  readonly collectionResolver?: CollectionResolver;
}

// options to core functions computeValue() and redact()
export interface ComputeOptions extends Options {
  readonly root?: RawObject;
}

/**
 * Creates an Option from another required keys are initialized
 * @param options Options
 */
export function makeOptions(options?: Options): Options {
  return Object.assign({ idKey: "_id" }, options || {});
}

/**
 * The different groups of operators
 */
export enum OperatorType {
  ACCUMULATOR = "accumulator",
  EXPRESSION = "expression",
  PIPELINE = "pipeline",
  PROJECTION = "projection",
  QUERY = "query",
}

// operator definitions
const OPERATORS: Record<OperatorType, OperatorMap> = {
  [OperatorType.ACCUMULATOR]: {},
  [OperatorType.EXPRESSION]: {},
  [OperatorType.PIPELINE]: {},
  [OperatorType.PROJECTION]: {},
  [OperatorType.QUERY]: {},
};

export type AccumulatorOperator = (
  collection: Collection,
  expr: AnyVal,
  options?: Options
) => AnyVal;

export type ExpressionOperator = (
  obj: RawObject,
  expr: AnyVal,
  options?: Options
) => AnyVal;

export type PipelineOperator = (
  collection: Iterator,
  expr: AnyVal,
  options?: Options
) => Iterator;

export type ProjectionOperator = (
  obj: RawObject,
  expr: AnyVal,
  field: string,
  options?: Options
) => AnyVal;

export type QueryOperator = (
  selector: string,
  value: AnyVal,
  options?: Options
) => (obj: RawObject) => boolean;

/** Map of operator functions */
export type OperatorMap = Record<
  string,
  | AccumulatorOperator
  | ExpressionOperator
  | PipelineOperator
  | ProjectionOperator
  | QueryOperator
>;

/** Special custom operator type for Query and Projection. */
type CustomOperator<R> = (
  selector: string,
  lhs: AnyVal,
  rhs: AnyVal,
  options?: Options
) => R;

export type CustomOperatorMap = Record<
  string,
  | AccumulatorOperator
  | ExpressionOperator
  | PipelineOperator
  | CustomOperator<AnyVal>
>;

/**
 * Validates the object collection of operators
 */
function validateOperatorMap(operators: RawObject): void {
  for (const [k, v] of Object.entries(operators)) {
    assert(
      v instanceof Function && isOperator(k),
      "invalid operator specified"
    );
  }
}

/**
 * Register fully specified operators for the given operator class.
 *
 * @param cls Category of the operator
 * @param operators Name of operator
 */
export function useOperators(cls: OperatorType, operators: OperatorMap): void {
  validateOperatorMap(operators);
  into(OPERATORS[cls], operators);
}

/**
 * Returns the operator function or null if it is not found
 * @param cls Category of the operator
 * @param operator Name of the operator
 */
export function getOperator(
  cls: OperatorType,
  operator: string
): Callback<AnyVal> | null {
  return has(OPERATORS[cls], operator) ? OPERATORS[cls][operator] : null;
}

/** Context used for creating new operators */
export interface OperatorContext {
  readonly computeValue: typeof computeValue;
  readonly resolve: typeof resolve;
}

/**
 * Add new operators
 *
 * @param cls the operator class to extend
 * @param operatorFn a callback that accepts internal object state and returns an object of new operators.
 */
export function addOperators(
  cls: OperatorType,
  operatorFn: (context: OperatorContext) => CustomOperatorMap
): void {
  const customOperators = operatorFn({ computeValue, resolve });

  validateOperatorMap(customOperators);

  // check for existing operators
  for (const [op, _] of Object.entries(customOperators)) {
    const call = getOperator(cls, op);
    assert(!call, `${op} already exists for '${cls}' operators`);
  }

  const normalizedOperators: OperatorMap = {};

  switch (cls) {
    case OperatorType.QUERY:
      for (const [op, f] of Object.entries(customOperators)) {
        const fn = f as CustomOperator<boolean>;
        normalizedOperators[op] =
          (selector: string, value: AnyVal, options: Options) =>
          (obj: RawObject): boolean => {
            // value of field must be fully resolved.
            const lhs = resolve(obj, selector, { unwrapArray: true });
            return fn(selector, lhs, value, options);
          };
      }
      break;
    case OperatorType.PROJECTION:
      for (const [op, f] of Object.entries(customOperators)) {
        const fn = f as CustomOperator<AnyVal>;
        normalizedOperators[op] = (
          obj: RawObject,
          expr: AnyVal,
          selector: string,
          options: Options
        ): AnyVal => {
          const lhs = resolve(obj, selector);
          return fn(selector, lhs, expr, options);
        };
      }
      break;
    default:
      for (const [op, fn] of Object.entries(customOperators)) {
        normalizedOperators[op] = (...args: RawArray) =>
          fn.apply(customOperators, args) as AnyVal;
      }
  }

  // toss the operator salad :)
  useOperators(cls, normalizedOperators);
}

/* eslint-disable unused-imports/no-unused-vars-ts */

/**
 * Implementation of system variables
 * @type {Object}
 */
const systemVariables: Record<string, Callback<AnyVal>> = {
  $$ROOT(obj: AnyVal, expr: AnyVal, options: ComputeOptions) {
    return options.root;
  },
  $$CURRENT(obj: AnyVal, expr: AnyVal, options: ComputeOptions) {
    return obj;
  },
  $$REMOVE(obj: AnyVal, expr: AnyVal, options: ComputeOptions) {
    return undefined;
  },
};

/**
 * Implementation of $redact variables
 *
 * Each function accepts 3 arguments (obj, expr, opt)
 *
 * @type {Object}
 */
const redactVariables: Record<string, Callback<AnyVal>> = {
  $$KEEP(obj: AnyVal, expr: AnyVal, options?: ComputeOptions): AnyVal {
    return obj;
  },
  $$PRUNE(obj: AnyVal, expr: AnyVal, options?: ComputeOptions): AnyVal {
    return undefined;
  },
  $$DESCEND(obj: AnyVal, expr: AnyVal, options?: ComputeOptions): AnyVal {
    // traverse nested documents iff there is a $cond
    if (!has(expr as RawObject, "$cond")) return obj;

    let result: ArrayOrObject;
    const newObj = cloneDeep(obj) as ArrayOrObject;

    for (const [key, current] of Object.entries(newObj)) {
      if (isObjectLike(current)) {
        if (current instanceof Array) {
          const array: RawArray = [];
          for (let elem of current) {
            if (isObject(elem)) {
              elem = redact(elem as RawObject, expr, options);
            }
            if (!isNil(elem)) {
              array.push(elem);
            }
          }
          result = array;
        } else {
          result = redact(current as RawObject, expr, options) as ArrayOrObject;
        }

        if (isNil(result)) {
          delete newObj[key]; // pruned result
        } else {
          newObj[key] = result;
        }
      }
    }
    return newObj;
  },
};
/* eslint-enable unused-imports/no-unused-vars-ts */

/**
 * Computes the value of the expression on the object for the given operator
 *
 * @param obj the current object from the collection
 * @param expr the expression for the given field
 * @param operator the operator to resolve the field with
 * @param options {Object} extra options
 * @returns {*}
 */
export function computeValue(
  obj: AnyVal,
  expr: AnyVal,
  operator: string,
  options?: ComputeOptions
): AnyVal {
  // ensure valid options exist on first invocation
  options = options || makeOptions();

  if (isOperator(operator)) {
    // if the field of the object is a valid operator
    let call = getOperator(OperatorType.EXPRESSION, operator);
    if (call) return call(obj, expr, options);

    // we also handle $group accumulator operators
    call = getOperator(OperatorType.ACCUMULATOR, operator);
    if (call) {
      // if object is not an array, first try to compute using the expression
      if (!(obj instanceof Array)) {
        obj = computeValue(obj, expr, null, options);
        expr = null;
      }

      // validate that we have an array
      assert(obj instanceof Array, `'${operator}' target must be an array.`);

      // we pass a null expression because all values have been resolved
      return call(obj, expr, options);
    }

    // operator was not found
    throw new Error(`operator '${operator}' is not registered`);
  }

  // if expr is a variable for an object field
  // field not used in this case
  if (isString(expr) && expr.length > 0 && expr[0] === "$") {
    // we return redact variables as literals
    if (has(redactVariables, expr)) {
      return expr;
    }

    // handle selectors with explicit prefix
    const arr = expr.split(".");
    if (has(systemVariables, arr[0])) {
      // set 'root' only the first time it is required to be used for all subsequent calls
      // if it already available on the options, it will be used
      obj = systemVariables[arr[0]](
        obj,
        null,
        into({ root: obj }, options) as ComputeOptions
      );
      if (arr.length == 1) return obj;
      expr = expr.substr(arr[0].length); // '.' prefix will be sliced off below
    }

    return resolve(obj as ArrayOrObject, (expr as string).slice(1));
  }

  // check and return value if already in a resolved state
  if (expr instanceof Array) {
    return (expr as RawArray).map((item: AnyVal) =>
      computeValue(obj, item, null, options)
    );
  } else if (isObject(expr)) {
    const result: RawObject = {};
    for (const [key, val] of Object.entries(expr as RawObject)) {
      result[key] = computeValue(obj, val, key, options);
      // must run ONLY one aggregate operator per expression
      // if so, return result of the computed value
      if (
        [OperatorType.EXPRESSION, OperatorType.ACCUMULATOR].some((c) =>
          has(OPERATORS[c], key)
        )
      ) {
        // there should be only one operator
        assert(
          Object.keys(expr).length === 1,
          "Invalid aggregation expression '" + JSON.stringify(expr) + "'"
        );

        return result[key];
      }
    }
    return result;
  } else {
    return expr;
  }
}

/**
 * Redact an object
 * @param  {Object} obj The object to redact
 * @param  {*} expr The redact expression
 * @param  {*} options  Options for value
 * @return {*} returns the result of the redacted object
 */
export function redact(
  obj: RawObject,
  expr: AnyVal,
  options: ComputeOptions
): AnyVal {
  const result = computeValue(obj, expr, null, options);
  return has(redactVariables, result as string)
    ? redactVariables[result as string](
        obj,
        expr,
        into({ root: obj }, options) as ComputeOptions
      )
    : result;
}
