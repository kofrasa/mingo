import type { Context, ProcessingMode } from "./core";

export type {
  AccumulatorOperator,
  ExpressionOperator,
  PipelineOperator,
  ProjectionOperator,
  QueryOperator,
  UpdateOperator,
  WindowOperator
} from "./operators/typings";

export type Any = unknown;
export type AnyObject = Record<string, Any>;
export type ArrayOrObject = AnyObject | Any[];

export type SortSpec = Record<string, 1 | -1>;

// Generic callback
export interface Callback<R = Any, T = Any> {
  (...args: T[]): R;
}

// Generic predicate
export interface Predicate {
  (...args: any[]): boolean; // eslint-disable-line @typescript-eslint/no-explicit-any
}

// Generic comparator callback
export interface Comparator<T = Any> {
  (left: T, right: T): number;
}

type CommonTypes =
  | "null"
  | "undefined"
  | "string"
  | "date"
  | "array"
  | "object";

// Javascript native types
export type JsType =
  | CommonTypes
  | "boolean"
  | "number"
  | "string"
  | "regexp"
  | "function";

// MongoDB BSON types
export type BsonType =
  | CommonTypes
  | "bool"
  | "int"
  | "long"
  | "double"
  | "decimal"
  | "regex";

/**
 * Resolves the given string to a Collection.
 * This is useful for operators that require a second collection to use such as $lookup and $out.
 * The collection is not cached and will be resolved each time it is used.
 */
export type CollectionResolver = (name: string) => AnyObject[];

/** Specification for collation options */
export interface CollationSpec {
  readonly locale: string;
  readonly caseLevel?: boolean;
  readonly caseFirst?: "upper" | "lower" | "off";
  readonly strength?: 1 | 2 | 3;
  readonly numericOrdering?: boolean;
  readonly alternate?: string;
  readonly maxVariable?: never; // unsupported
  readonly backwards?: never; // unsupported
}

/**
 * JSON schema validator
 */
export type JsonSchemaValidator = (schema: AnyObject) => Predicate;

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
  /** Enable or disable custom script execution using `$where`, `$accumulator`, and `$function` operators. @default true. */
  readonly scriptEnabled: boolean;
  /** When true, throws an error if an operator fails otherwise set to null. @default true. */
  readonly failOnError: boolean;
  /** This option does nothing and will be removed in future versions. @deprecated */
  readonly hashFunction?: (x: Any) => number;
  /** Function to resolve strings to arrays for use with operators that reference other collections such as; `$lookup`, `$out` and `$merge`. */
  readonly collectionResolver?: CollectionResolver;
  /** JSON schema validator to use with the '$jsonSchema' operator. Required in order to use the operator. */
  readonly jsonSchemaValidator?: JsonSchemaValidator;
  /** Global variables. */
  readonly variables?: Readonly<AnyObject>;
  /** Extra references to operators to be used for processing. */
  readonly context: Context;
}

// -------------------- Core building blocks --------------------

// Primitive types stop recursion
type Primitive = string | number | boolean | bigint | symbol | null | undefined;

// Numeric index segment
type NumericIndex = `${number}`;

// Generate all nested paths of T
type UpdateDotPaths<T> = {
  [K in keyof T & string]: T[K] extends Primitive
    ? K
    : T[K] extends Array<infer U>
      ?
          | K
          // numeric index
          | `${K}.${NumericIndex}`
          | `${K}.${NumericIndex}.${UpdateDotPaths<U>}`
          // positional operators
          | `${K}.$`
          | `${K}.$.${UpdateDotPaths<U>}`
          | `${K}.$[]`
          | `${K}.$[].${UpdateDotPaths<U>}`
          | `${K}.$[${string}]`
          | `${K}.$[${string}].${UpdateDotPaths<U>}`
      : K | `${K}.${UpdateDotPaths<T[K]>}`;
}[keyof T & string];

// Only one ".$." allowed
type SingleDollar<S extends string> =
  S extends `${string}$.${string}$.${string}` ? never : S;

// No chained "$" and "$[]"
type NoChainedPositional<S extends string> =
  S extends `${string}$.${string}$[]${string}`
    ? never
    : S extends `${string}$[].${string}$.${string}`
      ? never
      : S;

// Final UpdatePath type
type UpdatePath<T> =
  UpdateDotPaths<T> extends infer P extends string
    ? P extends SingleDollar<P>
      ? P extends NoChainedPositional<P>
        ? P
        : never
      : never
    : never;

export type UpdateExpr<T, V = Any> = Partial<Record<UpdatePath<T>, V>>;

// -------------------- NestedPath (arrays allow direct descent) --------------------
type FilterDotPaths<T> = {
  [K in keyof T & string]: T[K] extends Primitive
    ? K
    : T[K] extends Array<infer U>
      ?
          | K
          | `${K}.${NumericIndex}`
          | `${K}.${NumericIndex}.${FilterDotPaths<U>}`
          | (U extends Primitive ? never : `${K}.${FilterDotPaths<U>}`)
      : K | `${K}.${FilterDotPaths<T[K]>}`;
}[keyof T & string];

export type Criteria<T> = Partial<Record<FilterDotPaths<T>, Any>>;

// Allows any dot-separated path that starts with a valid top-level key of T.
// Nested segments are arbitrary (not validated against T’s structure).
type ProjectPath<T> = {
  [K in keyof T & string]: K | `${K}.${string}`;
}[keyof T & string];

export type Projection<T> = Partial<Record<ProjectPath<T>, Any>>;
