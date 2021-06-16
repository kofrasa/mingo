export type AnyVal = unknown;
export type RawObject = Record<string, AnyVal>;
export type RawArray = Array<AnyVal>;
export type ArrayOrObject = RawObject | RawArray;

/** Represents an array of documents */
export type Collection = Array<RawObject>;

// Generic callback
export interface Callback<R> {
  (...args: AnyVal[]): R;
}

// Generic predicate
export interface Predicate<T> {
  (...args: T[]): boolean;
}
