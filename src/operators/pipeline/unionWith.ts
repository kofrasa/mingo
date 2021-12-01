import { Aggregator } from "../../aggregator";
import { Options } from "../../core";
import { Iterator, Lazy } from "../../lazy";
import { RawObject } from "../../types";
import { isString } from "../../util";

interface InputExpr {
  readonly coll: RawObject[];
  readonly pipeline?: RawObject[];
}

/**
 * Performs a union of two collections.
 *
 * @param collection
 * @param expr
 * @param opt
 */
export function $unionWith(
  collection: Iterator,
  expr: InputExpr,
  options?: Options
): Iterator {
  const array = isString(expr.coll)
    ? options?.collectionResolver(expr.coll)
    : expr.coll;

  const iterators = [collection];
  iterators.push(
    expr.pipeline
      ? new Aggregator(expr.pipeline, options).stream(array)
      : Lazy(array)
  );

  let i = 0;
  return Lazy(() => {
    while (i < iterators.length) {
      const o = iterators[i].next();
      if (!o.done) return o;
      i++;
    }
    return { done: true };
  });
}
