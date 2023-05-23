/**
 * Type Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#type-expression-operators
 */

import { computeValue, Options } from "../../../core";
import { AnyVal, RawObject } from "../../../types";
import { isNil } from "../../../util";
import { TypeConvertError } from "./_internal";
import { $toBool } from "./toBool";
import { $toDate } from "./toDate";
import { $toDouble } from "./toDouble";
import { $toInt } from "./toInt";
import { $toLong } from "./toLong";
import { $toString } from "./toString";

interface ConvertOptions {
  input: AnyVal;
  to: string | number;
  onError?: AnyVal;
  onNull?: AnyVal;
}

/**
 * Converts a value to a specified type.
 *
 * @param obj
 * @param expr
 */
export function $convert(
  obj: RawObject,
  expr: AnyVal,
  options: Options
): AnyVal {
  const args = computeValue(obj, expr, null, options) as ConvertOptions;

  args.onNull = args.onNull === undefined ? null : args.onNull;

  if (isNil(args.input)) return args.onNull;

  try {
    switch (args.to) {
      case 2:
      case "string":
        return $toString(obj, args.input, options);

      case 8:
      case "boolean":
      case "bool":
        return $toBool(obj, args.input, options);

      case 9:
      case "date":
        return $toDate(obj, args.input, options);

      case 1:
      case 19:
      case "double":
      case "decimal":
      case "number":
        return $toDouble(obj, args.input, options);

      case 16:
      case "int":
        return $toInt(obj, args.input, options);

      case 18:
      case "long":
        return $toLong(obj, args.input, options);
    }
  } catch (e) {
    /*nothing to do*/
  }

  if (args.onError !== undefined) return args.onError;

  throw new TypeConvertError(`could not convert to type ${args.to}.`);
}
