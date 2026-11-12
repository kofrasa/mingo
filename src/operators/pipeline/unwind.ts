import { Iterator, Lazy } from "../../lazy";
import { Any, AnyObject, Callback, Options } from "../../types";
import {
  isArray,
  isNil,
  isString,
  removeValue,
  resolve,
  resolveGraph,
  setValue
} from "../../util/_internal";

/**
 * Deconstructs an array field from the input documents to output a document for each element. Each output document replaces the array with an element value.
 * For each input document, outputs n documents where n is the number of array elements and can be zero for an empty array.
 *
 * See {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/unwind/ usage}.
 */
export function $unwind(
  coll: Iterator,
  expr:
    | string
    | {
        path: string;
        includeArrayIndex?: string;
        preserveNullAndEmptyArrays?: boolean;
      },
  _options: Options
): Iterator {
  if (isString(expr)) expr = { path: expr };

  const path = expr.path;
  const field = path.substring(1);
  const includeArrayIndex = expr?.includeArrayIndex || false;
  const preserveNullAndEmptyArrays = expr.preserveNullAndEmptyArrays || false;

  const format = (o: AnyObject, i: number | null) => {
    if (includeArrayIndex !== false) o[includeArrayIndex] = i;
    return o;
  };

  let value: Any;

  return Lazy(() => {
    for (;;) {
      // take from lazy sequence if available
      if (value instanceof Iterator) {
        const tmp = value.next();
        if (!tmp.done) return tmp;
      }

      // fetch next object
      const wrapper = coll.next();
      if (wrapper.done) return wrapper;

      // unwrap value
      const obj = wrapper.value as AnyObject;

      // get the value of the field to unwind
      value = resolve(obj, field) as AnyObject[];

      // throw error if value is not an array???
      if (isArray(value)) {
        if (value.length === 0 && preserveNullAndEmptyArrays === true) {
          value = null; // reset unwind value
          removeValue(obj, field);
          return { value: format(obj, null), done: false };
        } else {
          // construct a lazy sequence for elements per value
          value = Lazy(value).map(((item, i: number) => {
            const newObj = resolveGraph(obj, field, {
              preserveKeys: true
            }) as AnyObject;
            setValue(newObj, field, item);
            return format(newObj, i);
          }) as Callback);
        }
      } else if (!isNil(value) || preserveNullAndEmptyArrays === true) {
        // like MongoDB, only a missing or null field (or an empty array) drops the document
        return { value: format(obj, null), done: false };
      }
    }
  });
}
