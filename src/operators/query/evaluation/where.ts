import { Any, Callback, Options, Predicate } from "../../../types";
import { assert, isFunction, truthy } from "../../../util/_internal";

/**
 * Matches documents that satisfy a custom predicate function.
 */
export function $where(_: string, rhs: Any, opts: Options): Callback<boolean> {
  assert(
    opts.scriptEnabled,
    "$where requires 'scriptEnabled' option to be true"
  );
  const f = rhs as Predicate;
  assert(isFunction(f), "$where only accepts a Function objects");
  return obj => truthy(f.call(obj), opts?.useStrictMode);
}
