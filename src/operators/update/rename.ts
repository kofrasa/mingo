import { UpdateOptions } from "../../core";
import { ArrayOrObject, RawObject } from "../../types";
import { has } from "../../util";
import { Action, applyUpdate, walkExpression } from "./_internal";
import { $set } from "./set";

/** Replaces the value of a field with the specified value. */
export const $rename = (
  obj: RawObject,
  expr: Record<string, string>,
  arrayFilters: RawObject[] = [],
  options: UpdateOptions = {}
) => {
  const res: string[] = [];
  const changed = walkExpression(expr, arrayFilters, options, ((
    val,
    node,
    queries
  ) => {
    return applyUpdate(obj, node, queries, (o: ArrayOrObject, k: string) => {
      if (!has(o as RawObject, k)) return false;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      res.push(...$set(obj, { [val]: o[k] }, arrayFilters, options));
      delete o[k];
      return true;
    });
  }) as Action<string>);
  return Array.from(new Set(changed.concat(res)));
};
