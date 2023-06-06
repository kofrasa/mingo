import * as UPDATE_OPERATORS from "./operators/update";
import { Query } from "./query";
import { RawObject } from "./types";
import { assert, has } from "./util";

// https://stackoverflow.com/questions/60872063/enforce-typescript-object-has-exactly-one-key-from-a-set
/** Define maps to enforce a single key from a union. */
type OneKey<K extends keyof any, V, KK extends keyof any = K> = {
  [P in K]: { [Q in P]: V } & { [Q in Exclude<KK, P>]?: never } extends infer O
    ? { [Q in keyof O]: O[Q] }
    : never;
}[K];

export type UpdateExpression = OneKey<keyof typeof UPDATE_OPERATORS, RawObject>;

/** Interface for update operators */
export type UpdateOperator = (
  obj: RawObject,
  expr: RawObject,
  arrayFilters: RawObject[]
) => string[];

/**
 * Updates the given object with the expression.
 *
 * @param obj The object to update.
 * @param expr The update expressions.
 * @param arrayFilters Filters to apply to nested items.
 * @param condition Query conditions to validate on object before performing update. Processed with useStrictMode=false.
 * @returns {Array<string>} A list of modified field paths in the object.
 */
export function updateObject(
  obj: RawObject,
  expr: UpdateExpression,
  arrayFilters: RawObject[] = [],
  condition: RawObject = {}
): Array<string> {
  // validate operator
  const entry = Object.entries(expr);
  // check for single entry
  assert(
    entry.length === 1,
    "Update expression must contain only one operator."
  );
  const [op, args] = entry[0] as [string, RawObject];
  // check operator exists
  assert(
    has(UPDATE_OPERATORS, op),
    `Update operator '${op}' is not supported.`
  );
  /*eslint import/namespace: ['error', { allowComputed: true }]*/
  const mutate = UPDATE_OPERATORS[op] as UpdateOperator;
  // validate condition
  if (Object.keys(condition).length) {
    const q = new Query(condition, { useStrictMode: false });
    if (!q.test(obj)) return [] as string[];
  }
  // apply updates
  return mutate(obj, args, arrayFilters);
}
