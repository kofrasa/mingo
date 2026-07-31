import { Any, AnyObject, SortSpec } from "../../types";
import {
  assert,
  compare,
  has,
  isArray,
  isEqual,
  isInteger,
  isNumber,
  isObject,
  resolve
} from "../../util";
import {
  applyUpdate,
  clone,
  DEFAULT_OPTIONS,
  walkExpression
} from "./_internal";

const MODIFIERS = ["$each", "$slice", "$sort", "$position"] as const;

/** Appends a specified value to an array. */
export function $push(
  expr: AnyObject,
  arrayFilters: AnyObject[] = [],
  options = DEFAULT_OPTIONS
) {
  for (const pushSpec of Object.values(expr)) {
    if (isObject(pushSpec) && MODIFIERS.some(m => has(pushSpec, m))) {
      assert(
        isArray(pushSpec.$each),
        `The argument to $each in $push must be an array.`
      );
      assert(
        pushSpec.$slice === undefined || isInteger(pushSpec.$slice),
        `The value for $slice must be an integer value.`
      );
      assert(
        pushSpec.$position === undefined || isInteger(pushSpec.$position),
        `The value for $position must be an integer value.`
      );
    }
  }

  return (obj: AnyObject) => {
    return walkExpression(expr, arrayFilters, options, (val, node, queries) => {
      const args: {
        $each: Any[];
        $slice?: number;
        $sort?: SortSpec | 1 | -1;
        $position?: number;
      } = {
        $each: [val]
      };

      if (isObject(val) && MODIFIERS.some(m => has(val, m))) {
        Object.assign(args, val);
      }

      return applyUpdate(
        obj,
        node,
        queries,
        (o: AnyObject, k: string) => {
          const arr = o[k] as Any[];

          if (!isArray(arr)) {
            if (arr === undefined) {
              o[k] = clone(args.$each, options);
              return true;
            }
            return false;
          }

          // take a copy of sufficient length.
          const prev = arr.slice(0, args.$slice || arr.length);
          const oldsize = arr.length;
          const pos = isNumber(args.$position) ? args.$position : arr.length;

          // insert new items
          arr.splice(pos, 0, ...(clone(args.$each, options) as Any[]));

          if (args.$sort) {
            const sortKey = isObject(args.$sort)
              ? Object.keys(args.$sort)[0]
              : "";
            const order: number = !sortKey
              ? (args.$sort as number)
              : (args.$sort as SortSpec)[sortKey];
            const f = !sortKey
              ? (a: Any) => a
              : (a: Any) => resolve(a as AnyObject, sortKey);
            arr.sort((a, b) => order * compare(f(a), f(b)));
          }

          // handle slicing
          if (isNumber(args.$slice)) {
            if (args.$slice < 0) arr.splice(0, arr.length + args.$slice);
            else arr.splice(args.$slice);
          }

          // detect change
          return oldsize != arr.length || !isEqual(prev, arr);
        },
        { descendArray: true, buildGraph: true }
      );
    });
  };
}
