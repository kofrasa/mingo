// Array Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#array-expression-operators

import { computeValue, Options } from "../../../core";
import { AnyVal, RawArray, RawObject } from "../../../types";
import { assert, has, isArray, isObject } from "../../../util";

/**
 * Converts an array of key value pairs to a document.
 */
export function $arrayToObject(
  obj: RawObject,
  expr: AnyVal,
  options: Options
): RawObject {
  const arr = computeValue(obj, expr, null, options) as Array<RawArray>;
  assert(isArray(arr), "$arrayToObject expression must resolve to an array");

  return arr.reduce((newObj: RawObject, val: AnyVal) => {
    // flatten
    while (isArray(val) && val.length === 1) val = val[0];

    if (val instanceof Array && val.length == 2) {
      newObj[val[0] as string] = val[1];
    } else {
      const valObj = val as { k: string; v: AnyVal };
      assert(
        isObject(valObj) && has(valObj, "k") && has(valObj, "v"),
        "$arrayToObject expression is invalid."
      );
      newObj[valObj.k] = valObj.v;
    }
    return newObj;
  }, {});
}
