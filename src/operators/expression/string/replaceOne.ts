import { evalExpr } from "../../../core/_internal";
import { Any, AnyObject, Options } from "../../../types";
import { isNil, isString } from "../../../util";
import { errExpectString } from "../_internal";

const OP = "$replaceOne";

/**
 * Replaces the first instance of a matched string in a given input.
 */
export const $replaceOne = (
  obj: AnyObject,
  expr: Any,
  options: Options
): Any => {
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

  // MongoDB replaces only the first instance and treats `find`/`replacement`
  // as literal strings. `String.prototype.replace` with a string pattern would
  // still interpret `$`-substitution patterns in `replacement`, so splice manually.
  const idx = input.indexOf(find);
  if (idx < 0) return input;
  return input.slice(0, idx) + replacement + input.slice(idx + find.length);
};
