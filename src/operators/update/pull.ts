import { Query } from "../../query";
import { Any, AnyObject } from "../../types";
import { isArray, isObject, isOperator } from "../../util";
import { applyUpdate, DEFAULT_OPTIONS, walkExpression } from "./_internal";

/** Removes from an existing array all instances of a value or values that match a specified condition. */
export function $pull(
  expr: AnyObject,
  arrayFilters: AnyObject[] = [],
  options = DEFAULT_OPTIONS
) {
  const predicates = Object.values(expr).map(pullSpec => {
    // wrap simple values or condition objects
    const wrap = !isObject(pullSpec) || Object.keys(pullSpec).some(isOperator);
    const query = new Query(wrap ? { k: pullSpec } : pullSpec, options);
    return wrap
      ? (v: Any) => query.test({ k: v })
      : (v: Any) => query.test(v as AnyObject);
  });

  return (obj: AnyObject) => {
    let index = 0;
    return walkExpression(expr, arrayFilters, options, (_, node, queries) => {
      const pred = predicates[index++];
      return applyUpdate(obj, node, queries, (o: AnyObject, k: string) => {
        const prev = o[k] as Any[];
        if (!isArray(prev) || !prev.length) return false;

        const curr = new Array<Any>();
        let ok = false;
        for (const v of prev) {
          const b = pred(v);
          if (!b) curr.push(v);
          ok ||= b;
        }
        if (!ok) return false;
        o[k] = curr;
        return true;
      });
    });
  };
}
