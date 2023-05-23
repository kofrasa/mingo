import { Options } from "../../core";
import { AnyVal, Callback, RawObject } from "../../types";
import { isNumber } from "../../util";
import { $push } from "../accumulator";
import { WindowOperatorInput } from "../pipeline/_internal";
import { withMemo } from "./_internal";

/**
 * Given two points (x1, y1) and (x2, y2) and a value 'x' that lies between those two points,
 * solve for 'y' with: y = y1 + (x - x1) * ((y2 - y1)/(x2 - x1)).
 * @see https://en.wikipedia.org/wiki/Linear_interpolation
 */
const interpolate = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  x: number
): number => y1 + (x - x1) * ((y2 - y1) / (x2 - x1));

/**
 * Fills null and missing fields in a window using linear interpolation based on surrounding field values.
 */
export function $linearFill(
  _: RawObject,
  collection: RawObject[],
  expr: WindowOperatorInput,
  options: Options
): AnyVal {
  return withMemo(
    collection,
    expr,
    (() => {
      const sortKey = "$" + Object.keys(expr.parentExpr.sortBy)[0];
      const points = $push(
        collection,
        [sortKey, expr.inputExpr],
        options
      ).filter((([x, _]: number[]) => isNumber(+x)) as Callback) as number[][];

      if (points.length !== collection.length) return null;

      let lindex = -1;
      let rindex = 0;

      while (rindex < points.length) {
        // use sliding window over missing values and fill as we go.

        // determine nearest left value index
        while (lindex + 1 < points.length && isNumber(points[lindex + 1][1])) {
          lindex++;
          rindex = lindex;
        }
        // determine nearest right value index.
        while (rindex + 1 < points.length && !isNumber(points[rindex + 1][1])) {
          rindex++;
        }
        // we reached the end of our array. nothing more to do.
        if (rindex + 1 >= points.length) break;
        // otherwise, we found a number so move rindex pointer to it.
        rindex++;
        // now fill everything between lindex and rindex by their proportions to the difference.
        while (lindex + 1 < rindex) {
          points[lindex + 1][1] = interpolate(
            points[lindex][0],
            points[lindex][1],
            points[rindex][0],
            points[rindex][1],
            points[lindex + 1][0]
          );
          lindex++;
        }
        // move lindex to right
        lindex = rindex;
      }
      return points.map(([_, y]) => y);
    }) as Callback<number[]>,
    (values: number[]) => values[expr.documentNumber - 1]
  );
}
