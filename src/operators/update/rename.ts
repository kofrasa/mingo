import { AnyObject } from "../../types";
import { assert, has } from "../../util";
import { applyUpdate, DEFAULT_OPTIONS, walkExpression } from "./_internal";
import { $set } from "./set";

const isIdPath = (path: string, idKey: string) =>
  path === idKey || path.startsWith(`${idKey}.`);

/** Replaces the value of a field with the specified value. */
export function $rename(
  expr: Record<string, string>,
  arrayFilters: AnyObject[] = [],
  options = DEFAULT_OPTIONS
) {
  // validate target fields are not id field (source fields validated in walkExpression)
  const idKey = options.idKey;
  for (const target of Object.values(expr)) {
    assert(typeof target === "string", `$rename target must be a string.`);
    assert(
      !isIdPath(target, idKey),
      `Performing an update on the path '${target}' would modify the immutable field '${idKey}'.`
    );
  }
  return (obj: AnyObject) => {
    const res: string[] = [];
    const changed = walkExpression<string>(
      expr,
      arrayFilters,
      options,
      (val, node, queries) => {
        return applyUpdate(obj, node, queries, (o: AnyObject, k: string) => {
          if (!has(o, k)) return false;
          Array.prototype.push.apply(
            res,
            $set({ [val]: o[k] }, arrayFilters, options)(obj)
          );
          delete o[k];
          return true;
        });
      }
    );
    return Array.from(new Set(changed.concat(res)));
  };
}
