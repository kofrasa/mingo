import { isInteger, isNil, isNumber } from "../../../util";
import { errExpectInteger, errExpectNumber } from "../_internal";

/**
 * Truncates integer value to number of places. If roundOff is specified round value instead to the number of places.
 */
export function truncate(
  num: number,
  precision: number,
  opts: { roundOff: boolean; failOnError: boolean; name: string }
) {
  const { name, roundOff, failOnError } = opts;

  if (isNil(num)) return null;
  if (Number.isNaN(num) || Math.abs(num) === Infinity) return num;

  if (!isNumber(num)) {
    return errExpectNumber(failOnError, `${name} arg1 <number>`);
  }

  if (!isInteger(precision) || precision < -20 || precision > 100) {
    return errExpectInteger(failOnError, `${name} arg2 <precision>`, {
      min: -20,
      max: 100
    });
  }

  const sign = Math.abs(num) === num ? 1 : -1;
  num = Math.abs(num);

  let result = Math.trunc(num);
  const decimals = parseFloat((num - result).toFixed(Math.abs(precision) + 1));

  if (precision === 0) {
    const firstDigit = Math.trunc(10 * decimals);
    if (
      roundOff &&
      (((result & 1) === 1 && firstDigit >= 5) || firstDigit > 5)
    ) {
      result++;
    }
  } else if (precision > 0) {
    const offset = Math.pow(10, precision);
    let remainder = Math.trunc(decimals * offset);

    // last digit before cut off
    const lastDigit = Math.trunc(decimals * offset * 10) % 10;

    // add one if last digit is greater than 5
    if (roundOff && lastDigit > 5) {
      remainder += 1;
    }

    // compute decimal remainder and add to whole number
    // manually formatting float re
    result = (result * offset + remainder) / offset;
  } else {
    // handle negative decimal places
    const offset = Math.pow(10, -1 * precision);
    let excess = result % offset;
    result = Math.max(0, result - excess);

    // for negative values the absolute must increase so we round up the last digit if >= 5
    if (roundOff && sign === -1) {
      while (excess > 10) {
        excess -= excess / 10;
      }
      if (result > 0 && excess >= 5) {
        result += offset;
      }
    }
  }

  return result * sign;
}
