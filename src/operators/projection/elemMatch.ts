import { Query } from "../../query";
import { Any, AnyObject, Options } from "../../types";
import { isArray, resolve } from "../../util";

/**
 * Projects only the first element from an array that matches the specified $elemMatch condition.
 */
export const $elemMatch = (
  obj: AnyObject,
  expr: Any,
  field: string,
  options: Options
): Any => {
  const arr = resolve(obj, field) as AnyObject[];
  const query = new Query(expr as AnyObject, options);

  if (!isArray(arr)) return undefined;

  const result: Any[] = [];
  for (let i = 0; i < arr.length; i++) {
    if (query.test(arr[i])) {
      // MongoDB projects only the first nested document when using this operator.
      // For some use cases this can lead to complicated queries to selectively project nested documents.
      // When strict mode is disabled, we return all matching nested documents.
      if (options.useStrictMode) return [arr[i]] as Any[];
      result.push(arr[i]);
    }
  }
  return result.length > 0 ? result : undefined;
};
