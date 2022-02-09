export type AnyVal = unknown;
export type RawObject = Record<string, AnyVal>;
export type RawArray = Array<AnyVal>;
export type ArrayOrObject = RawObject | RawArray;

// Generic callback
export interface Callback<R = AnyVal, T = AnyVal> {
  (...args: T[]): R;
}

// Generic predicate
export interface Predicate<T> {
  (...args: T[]): boolean;
}

// Result of comparator function
export type ComparatorResult = -1 | 0 | 1;

// Generic comparator callback
export interface Comparator<T> {
  (left: T, right: T): ComparatorResult;
}

/**
 * Custom function to hash values to improve faster comparaisons
 */
export type HashFunction = Callback<number>;

// Javascript native types
export enum JsType {
  NULL = "null",
  UNDEFINED = "undefined",
  BOOLEAN = "boolean",
  NUMBER = "number",
  STRING = "string",
  DATE = "date",
  REGEXP = "regexp",
  ARRAY = "array",
  OBJECT = "object",
  FUNCTION = "function",
}

// MongoDB BSON types
export enum BsonType {
  BOOL = "bool",
  INT = "int",
  LONG = "long",
  DOUBLE = "double",
  DECIMAL = "decimal",
  REGEX = "regex",
}
