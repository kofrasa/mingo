import { Aggregator } from "../../aggregator";
import { computeValue, Options } from "../../core";
import { Iterator } from "../../lazy";
import { RawObject } from "../../types";
import { assert, hashCode, isArray, isString, resolve } from "../../util";
import { $mergeObjects } from "../accumulator";

interface InputExpr {
  readonly into: string | RawObject[];
  readonly on?: string | [string];
  readonly let?: RawObject;
  readonly whenMatched?:
    | "replace"
    | "keepExisting"
    | "merge"
    | "fail"
    | RawObject[];
  readonly whenNotMatched?: "insert" | "discard" | "fail";
}

/**
 * Writes the resulting documents of the aggregation pipeline to a collection.
 *
 * The stage can incorporate (insert new documents, merge documents, replace documents,
 * keep existing documents, fail the operation, process documents with a custom update pipeline)
 * the results into an output collection. To use the $merge stage, it must be the last stage in the pipeline.
 *
 * Note: Object are deep cloned for outputing regardless of the ProcessingMode.
 *
 * @param collection
 * @param expr
 * @param options
 * @returns {*}
 */
export function $merge(
  collection: Iterator,
  expr: InputExpr,
  options?: Options
): Iterator {
  const output: RawObject[] = isString(expr.into)
    ? options?.collectionResolver(expr.into)
    : expr.into;

  assert(
    output instanceof Array,
    `$merge: option 'into' must resolve to an array`
  );

  const onField = expr.on || options.idKey;

  const getHash = (o: RawObject) => {
    const val = isString(onField)
      ? resolve(o, onField)
      : onField.map((s) => resolve(o, s));
    return hashCode(val, options.hashFunction);
  };

  const hash: Record<string, [RawObject, number]> = {};

  // we assuming the lookup expressions are unique
  for (let i = 0; i < output.length; i++) {
    const obj = output[i];
    const k = getHash(obj);
    assert(
      !hash[k],
      "$merge: 'into' collection must have unique entries for the 'on' field."
    );
    hash[k] = [obj, i];
  }

  return collection.map((o: RawObject) => {
    const k = getHash(o);
    if (hash[k]) {
      const [target, i] = hash[k];
      if (isArray(expr.whenMatched)) {
        const vars = expr.let
          ? (computeValue(target, expr.let, null, options) as RawObject)
          : {};

        const newObj: RawObject = {};

        try {
          const aggregator = new Aggregator(expr.whenMatched, options);
          target["$new"] = o;
          for (const [name, val] of Object.entries(vars)) {
            target[`$${name}`] = val;
          }
          Object.assign(newObj, aggregator.run([target])[0]);
        } finally {
          delete newObj["$new"];
          for (const name of Object.keys(vars)) {
            delete newObj[`$${name}`];
          }
        }

        output[i] = newObj;
      } else {
        switch (expr.whenMatched) {
          case "replace":
            output[i] = o;
            break;
          case "fail":
            throw new Error(
              "$merge: failed due to matching as specified by 'whenMatched' option."
            );
          case "keepExisting":
            break;
          case "merge":
          default:
            output[i] = $mergeObjects(o, [target, o], options) as RawObject;
            break;
        }
      }
    } else {
      switch (expr.whenNotMatched) {
        case "discard":
          break;
        case "fail":
          throw new Error(
            "$merge: failed due to matching as specified by 'whenMatched' option."
          );
        case "insert":
        default:
          output.push(o);
          break;
      }
    }

    return o; // passthrough
  });
}
