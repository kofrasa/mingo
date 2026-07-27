import { assert, isNil } from "../../util";

export const ARR_OPTS = {
  int: { type: "integers" },
  obj: { type: "objects" }
};

export function errInvalidArgs(failOnError: boolean, message: string): null {
  assert(!failOnError, message);
  return null;
}

export function errExpectObject(failOnError: boolean, prefix: string): null {
  const msg = `${prefix} expression must resolve to object`;
  assert(!failOnError, msg);
  return null;
}

export function errExpectString(failOnError: boolean, prefix: string): null {
  const msg = `${prefix} expression must resolve to string`;
  assert(!failOnError, msg);
  return null;
}

export function errExpectNumber(
  failOnError: boolean,
  name: string,
  opts?: { integer?: boolean; min?: number; max?: number }
): null {
  const type = opts?.integer ? "integer" : "number";
  const min = opts?.min ?? -Infinity;
  const max = opts?.max ?? Infinity;
  let msg: string;
  if (min === 0 && max === 0) {
    // special case to indicate non-zero
    msg = `${name} expression must resolve to non-zero ${type}`;
  } else if (min === 0 && max === Infinity) {
    msg = `${name} expression must resolve to non-negative ${type}`;
  } else if (min !== -Infinity && max !== Infinity) {
    msg = `${name} expression must resolve to ${type} in range [${min}, ${max}]`;
  } else if (min > 0) {
    msg = `${name} expression must resolve to positive ${type}`;
  } else {
    msg = `${name} expression must resolve to ${type}`;
  }
  assert(!failOnError, msg);
  return null;
}

export const errExpectInteger = (
  failOnError: boolean,
  name: string,
  opts?: { min?: number; max?: number }
) => errExpectNumber(failOnError, name, { ...opts, integer: true });

export function errExpectArray(
  failOnError: boolean,
  prefix: string,
  opts?: { size?: number; type?: string }
): null {
  let suffix = "array";
  if (!isNil(opts?.size) && opts?.size >= 0)
    suffix = opts.size === 0 ? "non-zero array" : `array(${opts.size})`;
  if (opts?.type) suffix = `array of ${opts.type}`;
  const msg = `${prefix} expression must resolve to ${suffix}`;
  assert(!failOnError, msg);
  return null;
}
