export type AnyVal = unknown;
export type RawObject = Record<string, AnyVal>;
export type RawArray = Array<AnyVal>;
export type ArrayOrObject = RawObject | RawArray;

// Generic callback
export interface Callback<R = AnyVal, T = AnyVal> {
  (...args: T[]): R;
}

// Generic predicate
export interface Predicate<T = AnyVal> {
  (...args: T[]): boolean;
}

// Generic comparator callback
export interface Comparator<T> {
  (left: T, right: T): number;
}

export interface GroupByOutput {
  keys: RawArray;
  groups: RawArray[];
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

/** Duration for datetime periods */
export type Duration =
  | "year"
  | "quarter"
  | "month"
  | "week"
  | "day"
  | "hour"
  | "minute"
  | "second"
  | "millisecond";
