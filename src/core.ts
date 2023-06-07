import { Iterator } from "./lazy";
import {
  AnyVal,
  ArrayOrObject,
  Callback,
  HashFunction,
  Predicate,
  RawArray,
  RawObject
} from "./types";
import {
  assert,
  has,
  into,
  isArray,
  isFunction,
  isNil,
  isObject,
  isObjectLike,
  isOperator,
  isString,
  resolve
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
   * This option provides the greatest speedup for the biggest tradeoff.
   * When using the aggregation pipeline, you can use the "$out" operator to collect immutable intermediate results.
   *
   * @default
   */
  CLONE_OFF = "CLONE_OFF"
}

/**
 * Generic options interface passed down to all operators
 */
export interface Options {
  /** The key that is used to lookup the ID value of a document. @default "_id". */
  readonly idKey: string;
  /** The collation specification for string sorting operations. */
  readonly collation?: CollationSpec;
  /** Determines how to treat inputs and outputs. @default ProcessingMode.CLONE_OFF. */
  readonly processingMode: ProcessingMode;
  /** Enforces strict MongoDB compatibilty. See README. @default true. */
  readonly useStrictMode: boolean;
  /** Enable or disable custom script execution via $where, $accumulator, and $function operators. @default true. */
  readonly scriptEnabled: boolean;
  /** Hash function to replace the Effective Java default implementation. */
  readonly hashFunction?: HashFunction;
  /** Function to resolve strings to arrays for use with operators that reference other collections such as; `$lookup`, `$out` and `$merge`. */
  readonly collectionResolver?: CollectionResolver;
  /** JSON schema validator to use with the '$jsonSchema' operator. Required in order to use the operator. */
  readonly jsonSchemaValidator?: JsonSchemaValidator;
  /** Global variables. */
  readonly variables?: Readonly<RawObject>;
}

interface LocalData {
  /** The groupId computed for a group of documents. */
  readonly groupId?: AnyVal;
  /** Local user-defind variables. */
  readonly variables?: RawObject;
}

/** Custom type to facilitate type checking for global options */
export class ComputeOptions implements Options {
  private constructor(
    readonly options: Options,
    /** Reference to the root object when processing subgraphs of the object. */
    private _root: AnyVal,
    private _local?: LocalData,
    /** The current time in milliseconds. Remains the same throughout all stages of the aggregation pipeline. */
    readonly timestamp = Date.now()
  ) {
    this.options = options;
    this.update(_root, _local);
  }

  /**
   * Initialize new ComputeOptions. Returns the same object modified when the 'options' argument is a ComputeOptions.
   * @param options
   * @param root
   * @param local
   * @returns
   */
  static init(
    options?: Options,
    root?: AnyVal,
    local?: LocalData
  ): ComputeOptions {
    return options instanceof ComputeOptions
      ? options.update(
          // value can be '0' or 'false'
          isNil(options.root) ? root : options.root,
          Object.assign({}, options.local, local || {})
        )
      : new ComputeOptions(options || initOptions(), root, local);
  }

  /** Updates the internal mutable state. */
  update(root?: AnyVal, local?: LocalData): ComputeOptions {
    // NOTE: this is done for efficiency to avoid creating too many intermediate options objects.
    this._root = root;
    this._local = local
      ? Object.assign({}, local, {
          variables: Object.assign({}, this._local?.variables, local?.variables)
        })
      : local;

    return this;
  }

  get root() {
    return this._root;
  }
  get local() {
    return this._local;
  }
  get idKey() {
    return this.options.idKey;
  }
  get collation() {
    return this.options?.collation;
  }
  get processingMode() {
    return this.options?.processingMode || ProcessingMode.CLONE_OFF;
  }
  get useStrictMode() {
    return this.options?.useStrictMode;
  }
  get scriptEnabled() {
    return this.options?.scriptEnabled;
  }
  get hashFunction() {
    return this.options?.hashFunction;
  }
  get collectionResolver() {
    return this.options?.collectionResolver;
  }
  get jsonSchemaValidator() {
    return this.options?.jsonSchemaValidator;
  }
  get variables() {
    return this.options?.variables;
  }
}

/**
 * Creates an Option from another where required keys are initialized.
 * @param options Options
 */
export function initOptions(options?: Partial<Options>): Options {
  return Object.freeze({
    idKey: "_id",
    scriptEnabled: true,
    useStrictMode: true,
    processingMode: ProcessingMode.CLONE_OFF,
    ...options
  });
}

/**
 * Supported cloning modes.
 * - "structured": Uses the 'structuredClone' method if available otherwise performs a "deep" clone.
 * - "deep": Performs a recursive deep clone of the object.
 * - "none": No cloning. Uses the value as given.
 */
export type CloneMode = "structured" | "deep" | "none";

export interface UpdateOptions {
  /** Specifies whether to deep clone values to persist in the internal store. @default "none". */
  readonly cloneMode?: CloneMode;
  /** Options to use for processing queries. Unless overriden 'useStrictMode' is false.  */
  readonly queryOptions?: Partial<Options>;
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
  WINDOW = "window"
}

export type AccumulatorOperator = (
  collection: RawObject[],
  expr: AnyVal,
  options?: Options
) => AnyVal;

export type ExpressionOperator = (
  obj: RawObject,
  expr: AnyVal | RawObject | RawArray,
  options: Options
) => AnyVal;

export type PipelineOperator = (
  collection: Iterator,
  expr: AnyVal,
  options: Options
) => Iterator;

export type ProjectionOperator = (
  obj: RawObject,
  expr: AnyVal,
  selector: string,
  options: Options
) => AnyVal;

export type QueryOperator = (
  selector: string,
  value: AnyVal,
  options: Options
) => (obj: RawObject) => boolean;

export type WindowOperator = (
  obj: RawObject,
  array: RawObject[],
  expr: {
    parentExpr: AnyVal;
    inputExpr: AnyVal;
    documentNumber: number;
    field: string;
  },
  options: Options
) => AnyVal;

type Operator =
  | AccumulatorOperator
  | ExpressionOperator
  | PipelineOperator
  | ProjectionOperator
  | QueryOperator
  | WindowOperator;

/** Map of operator functions */
export type OperatorMap = Record<string, Operator>;

// operator definitions
const OPERATORS: Record<OperatorType, OperatorMap> = {
  [OperatorType.ACCUMULATOR]: {},
  [OperatorType.EXPRESSION]: {},
  [OperatorType.PIPELINE]: {},
  [OperatorType.PROJECTION]: {},
  [OperatorType.QUERY]: {},
  [OperatorType.WINDOW]: {}
};

/**
 * Register fully specified operators for the given operator class.
 *
 * @param type The operator type
 * @param operators Map of the operators
 */
export function useOperators(type: OperatorType, operators: OperatorMap): void {
  for (const [name, fn] of Object.entries(operators)) {
    assert(
      isFunction(fn) && isOperator(name),
      `'${name}' is not a valid operator`
    );
    const currentFn = getOperator(type, name);
    assert(
      !currentFn || fn === currentFn,
      `${name} already exists for '${type}' operators. Cannot change operator function once registered.`
    );
  }
  // toss the operator salad :)
  into(OPERATORS[type], operators);
}

/**
 * Returns the operator function or undefined if it is not found
 * @param type Type of operator
 * @param operator Name of the operator
 */
export function getOperator(type: OperatorType, operator: string): Callback {
  return OPERATORS[type][operator];
}

/* eslint-disable unused-imports/no-unused-vars-ts */

/**
 * Implementation of system variables
 * @type {Object}
 */
const systemVariables: Record<string, typeof redact> = {
  $$ROOT(obj: AnyVal, expr: AnyVal, options: ComputeOptions) {
    return options.root;
  },
  $$CURRENT(obj: AnyVal, expr: AnyVal, options: ComputeOptions) {
    return obj;
  },
  $$REMOVE(obj: AnyVal, expr: AnyVal, options: ComputeOptions) {
    return undefined;
  },
  $$NOW(obj: AnyVal, expr: AnyVal, options: ComputeOptions) {
    return new Date(options.timestamp);
  }
};

/**
 * Implementation of $redact variables
 *
 * Each function accepts 3 arguments (obj, expr, options)
 *
 * @type {Object}
 */
const redactVariables: Record<string, typeof redact> = {
  $$KEEP(obj: AnyVal, expr: AnyVal, options: ComputeOptions): AnyVal {
    return obj;
  },
  $$PRUNE(obj: AnyVal, expr: AnyVal, options: ComputeOptions): AnyVal {
    return undefined;
  },
  $$DESCEND(obj: RawObject, expr: AnyVal, options: ComputeOptions): AnyVal {
    // traverse nested documents iff there is a $cond
    if (!has(expr as RawObject, "$cond")) return obj;

    let result: ArrayOrObject;

    for (const [key, current] of Object.entries(obj)) {
      if (isObjectLike(current)) {
        if (current instanceof Array) {
          const array: RawArray = [];
          for (let elem of current) {
            if (isObject(elem)) {
              elem = redact(elem as RawObject, expr, options.update(elem));
            }
            if (!isNil(elem)) {
              array.push(elem);
            }
          }
          result = array;
        } else {
          result = redact(
            current as RawObject,
            expr,
            options.update(current)
          ) as ArrayOrObject;
        }

        if (isNil(result)) {
          delete obj[key]; // pruned result
        } else {
          obj[key] = result;
        }
      }
    }
    return obj;
  }
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
  operator: string | null,
  options?: Options
): AnyVal {
  // ensure valid options exist on first invocation
  const copts = ComputeOptions.init(options, obj);
  operator = operator || "";

  if (isOperator(operator)) {
    // if the field of the object is a valid operator
    const callExpression = getOperator(OperatorType.EXPRESSION, operator);
    if (callExpression) return callExpression(obj as RawObject, expr, copts);

    // we also handle $group accumulator operators
    const callAccumulator = getOperator(OperatorType.ACCUMULATOR, operator);
    if (callAccumulator) {
      // if object is not an array, first try to compute using the expression
      if (!(obj instanceof Array)) {
        obj = computeValue(obj, expr, null, copts);
        expr = null;
      }

      // validate that we have an array
      assert(obj instanceof Array, `'${operator}' target must be an array.`);

      // for accumulators, we use the global options since the root is specific to each element within array.
      return callAccumulator(
        obj as RawObject[],
        expr,
        // reset the root object for accumulators.
        copts.update(null, copts.local)
      );
    }

    // operator was not found
    throw new Error(`operator '${operator}' is not registered`);
  }

  // if expr is a string and begins with "$$", then we have a variable.
  //  this can be one of; redact variable, system variable, user-defined variable.
  //  we check and process them in that order.
  //
  // if expr begins only a single "$", then it is a path to a field on the object.
  if (isString(expr) && expr.length > 0 && expr[0] === "$") {
    // we return redact variables as literals
    if (has(redactVariables, expr)) {
      return expr;
    }

    // default to root for resolving path.
    let context = copts.root;

    // handle selectors with explicit prefix
    const arr = expr.split(".");
    if (has(systemVariables, arr[0])) {
      // set 'root' only the first time it is required to be used for all subsequent calls
      // if it already available on the options, it will be used
      context = systemVariables[arr[0]](
        obj as RawObject,
        null,
        copts
      ) as ArrayOrObject;
      expr = expr.slice(arr[0].length + 1); //  +1 for '.'
    } else if (arr[0].slice(0, 2) === "$$") {
      // handle user-defined variables
      context = Object.assign(
        {},
        copts.variables, // global vars
        // current item is added before local variables because the binding may be changed.
        { this: obj },
        copts.local?.variables // local vars
      );
      const prefix = arr[0].slice(2);

      assert(
        has(context as RawObject, prefix),
        `Use of undefined variable: ${prefix}`
      );
      expr = expr.slice(2);
    } else {
      // 'expr' is a path to a field on the object.
      expr = expr.slice(1);
    }

    if (expr === "") return context;
    return resolve(context as ArrayOrObject, expr as string);
  }

  // check and return value if already in a resolved state
  if (isArray(expr)) {
    return expr.map((item: AnyVal) => computeValue(obj, item, null, copts));
  } else if (isObject(expr)) {
    const result: RawObject = {};
    for (const [key, val] of Object.entries(expr as RawObject)) {
      result[key] = computeValue(obj, val, key, copts);
      // must run ONLY one aggregate operator per expression
      // if so, return result of the computed value
      if (
        [OperatorType.EXPRESSION, OperatorType.ACCUMULATOR].some(c =>
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
  const result = computeValue(obj, expr, null, options) as string;
  return has(redactVariables, result)
    ? redactVariables[result](obj, expr, options)
    : result;
}
