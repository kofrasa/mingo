import { UpdateOptions } from "../../core";
import { AnyVal, ArrayOrObject, RawArray, RawObject } from "../../types";
import { compare, has, isEqual, isNumber, isObject, resolve } from "../../util";
import { Action, applyUpdate, clone, walkExpression } from "./_internal";

const OPERATOR_MODIFIERS = Object.freeze([
  "$each",
  "$slice",
  "$sort",
  "$position"
]);

/** Appends a specified value to an array. */
export const $push = (
  obj: RawObject,
  expr: RawObject,
  arrayFilters: RawObject[] = [],
  options: UpdateOptions = {}
) => {
  return walkExpression(expr, arrayFilters, options, ((val, node, queries) => {
    const args: {
      $each: RawArray;
      $slice?: number;
      $sort?: Record<string, 1 | -1> | 1 | -1;
      $position?: number;
    } = {
      $each: [val]
    };

    if (
      isObject(val) &&
      OPERATOR_MODIFIERS.some(m => has(val as RawObject, m))
    ) {
      Object.assign(args, val);
    }

    return applyUpdate(
      obj,
      node,
      queries,
      (o: ArrayOrObject, k: string) => {
        const arr = o[k] as RawArray;
        // take a copy of sufficient length.
        const prev = arr.slice(0, args.$slice || arr.length);
        const oldsize = arr.length;
        const pos = isNumber(args.$position) ? args.$position : arr.length;

        // insert new items
        arr.splice(
          pos,
          0,
          ...(clone(options.cloneMode, args.$each) as RawArray)
        );

        if (args.$sort) {
          /* eslint-disable @typescript-eslint/no-unsafe-assignment */
          const sortKey = isObject(args.$sort)
            ? Object.keys(args.$sort || {}).pop()
            : "";
          const order: number = !sortKey ? args.$sort : args.$sort[sortKey];
          const f = !sortKey
            ? (a: AnyVal) => a
            : (a: AnyVal) => resolve(a as RawObject, sortKey);
          arr.sort((a, b) => order * compare(f(a), f(b)));
          /* eslint-enable @typescript-eslint/no-unsafe-assignment */
        }

        // handle slicing
        if (isNumber(args.$slice)) {
          if (args.$slice < 0) arr.splice(0, arr.length + args.$slice);
          else arr.splice(args.$slice);
        }

        // detect change
        return oldsize != arr.length || !isEqual(prev, arr);
      },
      { descendArray: true }
    );
  }) as Action<number>);
};
