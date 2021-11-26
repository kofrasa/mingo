import { computeValue, Options } from "../../core";
import { AnyVal, RawObject } from "../../types";
import { assert, groupBy, isEqual, isOperator } from "../../util";
import { WindowOperatorInput } from "../pipeline/_internal";

/** Returns the position of a document in the $setWindowFields stage partition. */
export function rank(
  obj: RawObject,
  collection: RawObject[],
  expr: WindowOperatorInput,
  options: Options,
  dense: boolean
): AnyVal {
  const outputExpr = expr.parentExpr.output[expr.field];
  const operator = Object.keys(outputExpr).find(isOperator);
  assert(
    !outputExpr.window,
    `$${operator} does not support 'window' option in $setWindowFields`
  );
  const sortKey = "$" + Object.keys(expr.parentExpr.sortBy)[0];
  const partitions = groupBy(
    collection,
    (o) => computeValue(o, sortKey, null, options),
    options.hashFunction
  );

  // same number of paritions as lenght means all sort keys are unique
  if (partitions.keys.length == collection.length) {
    return (obj[expr.indexKey] as number) + 1;
  }

  const current = computeValue(obj, sortKey, null, options);

  let rank = 0;
  for (let i = 0; i < partitions.keys.length; i++) {
    if (isEqual(current, partitions.keys[i])) return dense ? i : rank + 1;
    rank += partitions.groups[i].length;
  }
}
