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
