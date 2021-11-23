import { Iterator } from "./lazy";
import {
  AnyVal,
  ArrayOrObject,
  Callback,
  Predicate,
  RawArray,
  RawObject,
} from "./types";
import {
  assert,
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
export type CollectionResolver = (name: string) => Array<RawObject>;

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
 * JSON schema validator
 */
export type JsonSchemaValidator = (schema: RawObject) => Predicate<RawObject>;

/**
 * This controls how input and output documents are processed to meet different application needs.
 * Each mode has different trade offs for; immutability, reference sharing, and performance.
 */
export enum ProcessingMode {
  /**
   * Clone inputs prior to processing, and the outputs if some objects graphs may be shared.
   * Use this option to keep input collection immutable and to get distinct output objects.
   *
   * Note: This option is expensive and reduces performance.
   */
  CLONE_ALL = "CLONE_ALL",

  /**
   * Clones inputs prior to processing.
   * This option will return output objects with shared graphs in their path if specific operators are used.
   * Use this option to keep the input collection immutable.
   *
   */
  CLONE_INPUT = "CLONE_INPUT",

  /**
   * Clones the output to return distinct objects with no shared paths.
   * This option modifies the input collection and during processing.
   */
  CLONE_OUTPUT = "CLONE_OUTPUT",

  /**
   * Turn off cloning and modifies the input collection as needed.
   * This option will also return output objects with shared paths in their graph when specific operators are used.
   *
   * This option provides the greatest speedup for the biggest tradeoff. When using the aggregation pipeline, you can use
   * the "$out" operator to collect immutable intermediate results.
   *
   * @default
   */
  CLONE_OFF = "CLONE_OFF",
}

/**
 * Generic options interface passed down to all operators
 */
export interface Options {
  /** The key that is used to lookup the ID value of a document. @default "_id" */
  readonly idKey?: string;
  /** The collation specification for string operations. */
  readonly collation?: CollationSpec;
  /** Processing mode that determines how to treat inputs and outputs. @default ProcessingMode.CLONE_OFF */
  readonly processingMode?: ProcessingMode;
  /**
   * Enables or disables custom script execution.
   * When disabled, you cannot use operations that execute custom code, such as the $where, $accumulator, and $function.
   * @default true
   */
  readonly scriptEnabled?: boolean;
  /** Hash function to replace the somewhat weaker default implementation. */
  readonly hashFunction?: HashFunction;
  /** Function to resolve string reference to a collection for use by `$lookup` and `$out` operators. */
  readonly collectionResolver?: CollectionResolver;
  /** JSON schema validator to use with the $jsonSchema operator. Required to use the operator. */
  readonly jsonSchemaValidator?: JsonSchemaValidator;
}

// options to core functions computeValue() and redact()
interface ComputeOptions extends Options {
  /** Reference to the root object when processing subgraphs of the object  */
  readonly root?: RawObject;
  /** The groupId computed for a group of documents by the $group operator. */
  readonly groupId?: AnyVal;
}

/**
 * Creates an Option from another required keys are initialized
 * @param options Options
 */
export function makeOptions(options?: Options): Options {
  return {
    idKey: "_id",
    scriptEnabled: true,
    processingMode: ProcessingMode.CLONE_OFF,
    ...options,
  };
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

export type AccumulatorOperator = (
  collection: RawObject[],
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
  selector: string,
  options?: Options
) => AnyVal;

export type QueryOperator = (
  selector: string,
  value: AnyVal,
  options?: Options
) => (obj: RawObject) => boolean;

type Operator =
  | AccumulatorOperator
  | ExpressionOperator
  | PipelineOperator
  | ProjectionOperator
  | QueryOperator;

/** Map of operator functions */
type OperatorMap = Record<string, Operator>;

// operator definitions
const OPERATORS: Record<OperatorType, OperatorMap> = {
  [OperatorType.ACCUMULATOR]: {},
  [OperatorType.EXPRESSION]: {},
  [OperatorType.PIPELINE]: {},
  [OperatorType.PROJECTION]: {},
  [OperatorType.QUERY]: {},
};

/**
 * Register fully specified operators for the given operator class.
 *
 * @param type The operator type
 * @param operators Map of the operators
 */
export function useOperators(type: OperatorType, operators: OperatorMap): void {
  for (const [name, func] of Object.entries(operators)) {
    assert(
      func instanceof Function && isOperator(name),
      "invalid operator specified"
    );
    // const call = getOperator(type, name);
    // assert(!call, `${name} already exists for '${type}' operators`);
  }
  // toss the operator salad :)
  into(OPERATORS[type], operators);
}

/**
 * Returns the operator function or null if it is not found
 * @param type Type of operator
 * @param operator Name of the operator
 */
export function getOperator(
  type: OperatorType,
  operator: string
): Callback<AnyVal> | null {
  return OPERATORS[type][operator];
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
 * Each function accepts 3 arguments (obj, expr, options)
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

    for (const [key, current] of Object.entries(obj)) {
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
          delete obj[key]; // pruned result
        } else {
          obj[key] = result;
        }
      }
    }
    return obj;
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
      obj = systemVariables[arr[0]](obj, null, { root: obj, ...options });
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
  }

  return expr;
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
    ? redactVariables[result as string](obj, expr, { root: obj, ...options })
    : result;
}
