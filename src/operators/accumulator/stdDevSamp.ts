import { AccumulatorOperator, Options } from "../../core";
import { AnyVal, RawObject } from "../../types";
import { isNumber } from "../../util";
import { stddev } from "./_internal";
import { $push } from "./push";

/**
 * Returns the sample standard deviation of the input values.
 * @param  {Array} collection
 * @param  {Object} expr
 * @return {Number|null}
 */
export const $stdDevSamp: AccumulatorOperator<number> = (
  collection: RawObject[],
  expr: AnyVal,
  options: Options
): number => stddev($push(collection, expr, options).filter(isNumber), true);
