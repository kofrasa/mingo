import { AnyObject } from "../../types";
import { assert, isObject } from "../../util";
import { applyUpdate, DEFAULT_OPTIONS, walkExpression } from "./_internal";

type CurrentDateType = true | { $type: "date" | "timestamp" };

/** Sets the value of a field to the current date. */
export function $currentDate(
  expr: Record<string, CurrentDateType>,
  arrayFilters: AnyObject[] = [],
  options = DEFAULT_OPTIONS
) {
  for (const dateSpec of Object.values(expr)) {
    assert(
      dateSpec === true ||
        (isObject(dateSpec) &&
          (dateSpec.$type === "date" || dateSpec.$type === "timestamp")),
      `Invalid type for $currentDate. Please use a boolean ('true') or a $type expression ({$type: 'timestamp/date'}).`
    );
  }

  return (obj: AnyObject) => {
    return walkExpression<CurrentDateType>(
      expr,
      arrayFilters,
      options,
      (val, node, queries) => {
        return applyUpdate(
          obj,
          node,
          queries,
          (o: AnyObject, k: string) => {
            o[k] =
              val === true || val.$type === "date"
                ? options.now
                : options.now.getTime();
            return true;
          },
          { buildGraph: true }
        );
      }
    );
  };
}
