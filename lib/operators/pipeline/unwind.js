import { assert, clone, each, isArray, isEmpty, isString } from '../../util'
import { getValue } from '../../internal'

/**
 * Takes an array of documents and returns them as a stream of documents.
 *
 * @param collection
 * @param expr
 * @returns {Array}
 */
export function $unwind(collection, expr) {
  if (isString(expr)) {
    expr = { path: expr }
  }

  let field = expr.path.substr(1)
  let includeArrayIndex = expr.includeArrayIndex || false
  let preserveNullAndEmptyArrays = expr.preserveNullAndEmptyArrays || false
  let result = []

  let push = (o, i) => {
    if (includeArrayIndex !== false) o[includeArrayIndex] = i
    result.push(o)
  }

  each(collection, (obj) => {
    // must throw an error if value is not an array
    let value = getValue(obj, field)
    if (isArray(value)) {
      if (value.length === 0 && preserveNullAndEmptyArrays === true) {
        let tmp = clone(obj)
        delete tmp[field]
        push(tmp, null)
      } else {
        each(value, (item, i) => {
          let tmp = clone(obj)
          tmp[field] = item
          push(tmp, i)
        })
      }
    } else if (!isEmpty(value) || preserveNullAndEmptyArrays === true) {
      push(clone(obj), null)
    }
  })
  return result
}