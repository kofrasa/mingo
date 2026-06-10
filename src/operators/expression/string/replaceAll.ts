import { evalExpr } from "../../../core/_internal";
import { Any, AnyObject, Options } from "../../../types";
import { assert, isNil, isObject, isString } from "../../../util";
import { errExpectString } from "../_internal";

const OP = "$replaceAll";

/**
 * Replaces all instances of a matched string in a given input.
 */
export const $replaceAll = (
  obj: AnyObject,
  expr: Any,
  options: Options
): Any => {
  assert(isObject(expr), `${OP} expects an object argument`);
  const foe = options.failOnError;
  const args = evalExpr(obj, expr, options) as {
    input: string;
    find: string;
    replacement: string;
  };

  const { input, find, replacement } = args;
  if (isNil(input) || isNil(find) || isNil(replacement)) return null;
  if (!isString(input)) return errExpectString(foe, `${OP} 'input'`);
  if (!isString(find)) return errExpectString(foe, `${OP} 'find'`);
  if (!isString(replacement))
    return errExpectString(foe, `${OP} 'replacement'`);

  // MongoDB treats `find` and `replacement` as literal strings (no regex,
  // no `$` substitution patterns). Using a literal split/join keeps parity and
  // avoids ReDoS from a regex compiled out of a (possibly untrusted) `find`.
  return input.split(find).join(replacement);
};
