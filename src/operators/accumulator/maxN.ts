import { ComputeOptions, evalExpr } from "../../core/_internal";
import { Any, AnyObject, Options } from "../../types";
import { compare, isInteger, isNil } from "../../util";
import { errExpectInteger } from "../expression/_internal";
import { $push } from "./push";

interface InputExpr {
  n: Any;
  input: Any;
}

/**
 * Returns an aggregation of the maxmimum value n elements within a group.
 */
export const $maxN = (coll: AnyObject[], expr: InputExpr, options: Options) => {
  const copts = options as ComputeOptions;
  const n = evalExpr(copts?.local?.groupId, expr.n, copts) as number;
  if (!isInteger(n) || n < 1) {
    return errExpectInteger(options.failOnError, "$maxN 'n'", { min: 1 });
  }
  return $push(coll, expr.input, options)
    .filter(o => !isNil(o))
    .sort(compare)
    .slice(-n)
    .reverse();
};
