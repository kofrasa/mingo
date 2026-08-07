import { evalExpr } from "../../core/_internal";
import { Iterator, Lazy } from "../../lazy";
import { Query } from "../../query";
import type { Any, AnyObject, Options } from "../../types";
import { assert, flatten, HashMap, isArray, isNil, setValue } from "../../util";
import { resolveCollection } from "./_internal";
import { $lookup } from "./lookup";

interface InputExpr {
  /** Collection for the $graphLookup operation to search. */
  from: string | AnyObject[];
  /** Expression that specifies the value of the connectFromField with which to start the recursive search. */
  startWith: Any;
  /** Field name whose value $graphLookup uses to recursively match against the connectToField. */
  connectFromField: string;
  /** Field name in other documents against which to match the value of the field. */
  connectToField: string;
  /** Name of the array field added to each output document. */
  as: string;
  /** Non-negative integral number specifying the maximum recursion depth. */
  maxDepth?: number;
  /** Name of the field to add to each traversed document in the search path. */
  depthField?: string;
  /** A document specifying additional conditions for the recursive search. The syntax is identical to query filter syntax. */
  restrictSearchWithMatch?: AnyObject;
}

/**
 * Performs a recursive search on a collection.
 * To each output document, adds a new array field that contains the traversal results of the recursive search for that document.
 *
 * See {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/graphLookup/ usage}.
 */
export function $graphLookup(
  coll: Iterator,
  expr: InputExpr,
  options: Options
): Iterator {
  const fromColl = resolveCollection("$graphLookup", expr.from, options);
  assert(
    isArray(fromColl),
    "$graphLookup: expression 'from' must resolve to array"
  );

  const {
    connectFromField,
    connectToField,
    as: asField,
    maxDepth,
    depthField,
    restrictSearchWithMatch: matchExpr
  } = expr;

  // extra match condition
  const query = new Query(matchExpr ?? {}, options);

  return coll.map((obj: AnyObject) => {
    // initial object to start matching
    const matchObj = {};
    setValue(
      matchObj,
      connectFromField,
      evalExpr(obj, expr.startWith, options)
    );
    let matches: AnyObject[] = [matchObj];
    let i = -1;
    const map = HashMap.init<AnyObject, number>();
    do {
      i++;
      matches = flatten(
        $lookup(
          Lazy(matches),
          {
            from: fromColl,
            localField: connectFromField,
            foreignField: connectToField,
            as: asField
          },
          options
        )
          .map((o: AnyObject) => o[asField] as AnyObject)
          .collect()
      ) as AnyObject[];
      // filter matches by additional 'restrictSearchWithMatch' condition
      matches = matches.filter(o => query.test(o));
      const oldSize = map.size;
      for (const k of matches) map.set(k, map.get(k) ?? i);
      // check to see if there are any new items
      if (oldSize == map.size) break;
    } while (isNil(maxDepth) || i < maxDepth);

    const result = new Array(map.size);
    let n = 0;
    for (const [k, v] of map.entries()) {
      result[n++] = Object.assign(depthField ? { [depthField]: v } : {}, k);
    }
    return { ...obj, [asField]: result };
  });
}
