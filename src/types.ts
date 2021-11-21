export type AnyVal = unknown;
export type RawObject = Record<string, AnyVal>;
export type RawArray = Array<AnyVal>;
export type ArrayOrObject = RawObject | RawArray;

// Generic callback
export interface Callback<R> {
  (...args: AnyVal[]): R;
}

// Generic predicate
export interface Predicate<T> {
  (...args: T[]): boolean;
}
