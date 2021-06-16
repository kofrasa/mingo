import { Options } from "../../core";
import { Iterator, Lazy } from "../../lazy";
import { AnyVal, RawObject } from "../../types";
import {
  cloneDeep,
  isEmpty,
  isString,
  removeValue,
  resolve,
  setValue,
} from "../../util";

/**
 * Takes an array of documents and returns them as a stream of documents.
 *
 * @param collection
 * @param expr
 * @param options
 * @returns {Array}
 */
export function $unwind(
  collection: Iterator,
  expr:
    | string
    | {
        path: string;
        includeArrayIndex?: string;
        preserveNullAndEmptyArrays?: boolean;
      },
  options?: Options
): Iterator {
  if (isString(expr)) expr = { path: expr };

  const path = expr.path;
  const field = path.substr(1);
  const includeArrayIndex = expr?.includeArrayIndex || false;
  const preserveNullAndEmptyArrays = expr.preserveNullAndEmptyArrays || false;

  const format = (o: RawObject, i: number) => {
    if (includeArrayIndex !== false) o[includeArrayIndex] = i;
    return o;
  };

  let value: AnyVal;

  return Lazy(() => {
    for (;;) {
      // take from lazy sequence if available
      if (value instanceof Iterator) {
        const tmp = value.next();
        if (!tmp.done) return tmp;
      }

      // fetch next object
      const wrapper = collection.next();
      if (wrapper.done) return wrapper;

      // unwrap value
      const obj = wrapper.value as RawObject;

      // get the value of the field to unwind
      value = resolve(obj, field) as Array<RawObject>;

      // throw error if value is not an array???
      if (value instanceof Array) {
        if (value.length === 0 && preserveNullAndEmptyArrays === true) {
          value = null; // reset unwind value
          const tmp = cloneDeep(obj) as RawObject;
          removeValue(tmp, field);
          return { value: format(tmp, null), done: false };
        } else {
          // construct a lazy sequence for elements per value
          value = Lazy(value).map((item, i: number) => {
            const tmp = cloneDeep(obj) as RawObject;
            setValue(tmp, field, item);
            return format(tmp, i);
          });
        }
      } else if (!isEmpty(value) || preserveNullAndEmptyArrays === true) {
        const tmp = cloneDeep(obj) as RawObject;
        return { value: format(tmp, null), done: false };
      }
    }
  });
}
