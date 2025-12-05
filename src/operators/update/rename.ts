import { AnyObject, ArrayOrObject, Options } from "../../types";
import { assert, has } from "../../util";
import {
  Action,
  applyUpdate,
  DEFAULT_OPTIONS,
  walkExpression
} from "./_internal";
import { $set } from "./set";

const isIdPath = (path: string, idKey: string) =>
  path === idKey || path.startsWith(`${idKey}.`);

/** Replaces the value of a field with the specified value. */
export const $rename = (
  obj: AnyObject,
  expr: Record<string, string>,
  arrayFilters: AnyObject[] = [],
  options: Options = DEFAULT_OPTIONS
) => {
  // validate target fields are not id field (source fields validated in walkExpression)
  const idKey = options.idKey ?? "_id";
  for (const target of Object.values(expr)) {
    assert(
      !isIdPath(target, idKey),
      `Performing an update on the path '${target}' would modify the immutable field '${idKey}'.`
    );
  }

  const res: string[] = [];
  const changed = walkExpression(expr, arrayFilters, options, ((
    val,
    node,
    queries
  ) => {
    return applyUpdate(obj, node, queries, (o: ArrayOrObject, k: string) => {
      if (!has(o as AnyObject, k)) return false;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      res.push(...$set(obj, { [val]: o[k] }, arrayFilters, options));
      delete o[k];
      return true;
    });
  }) as Action<string>);
  return Array.from(new Set(changed.concat(res)));
};
