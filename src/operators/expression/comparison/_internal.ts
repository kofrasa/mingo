import { evalExpr } from "../../../core";
import { Any, AnyObject, Options } from "../../../types";
import { assert, isArray, isEqual, mingoCmp } from "../../../util/_internal";

export const EQ_CMP = (a: Any, b: Any) => +!isEqual(a, b);

export function compareValues(
  obj: AnyObject,
  expr: Any,
  options: Options,
  name: string,
  comparator = mingoCmp
): number {
  assert(isArray(expr) && expr.length === 2, `${name} expects array(2)`);
  const [lhs, rhs] = evalExpr(obj, expr, options) as Any[];
  return comparator(lhs, rhs);
}
