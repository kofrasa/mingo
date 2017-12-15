import { assert, clone, each, isArray, isEmpty, isString } from '../../util'
import { getValue } from '../../internal'
import { Lazy } from '../../lazy'

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

  let format = (o, i) => {
    if (includeArrayIndex !== false) o[includeArrayIndex] = i
    return o
  }

  let value

  return new Lazy({
    next () {
      while (true) {
        // take from lazy sequence if available
        if (Lazy.isIterator(value)) {
          let tmp = value.next()
          if (Lazy.isVal(tmp)) return tmp
        }

        // fetch next object
        let obj = collection.next()
        if (Lazy.isDone(obj)) return Lazy.done()

        // unwrap value
        obj = obj.value

        // get the value of the field to unwind
        value = getValue(obj, field)

        // throw error if value is not an array???
        if (isArray(value)) {
          if (value.length === 0 && preserveNullAndEmptyArrays === true) {
            value = null // reset unwind value
            let tmp = clone(obj)
            delete tmp[field]
            return { value: format(tmp, null), done: false }
          } else {
            // construct a lazy sequence for elements per value
            value = new Lazy(value).map((item, i) => {
              let tmp = clone(obj)
              tmp[field] = item
              return format(tmp, i)
            })
          }
        } else if (!isEmpty(value) || preserveNullAndEmptyArrays === true) {
          let tmp = format(clone(obj), null)
          return { value: tmp, done: false }
        }
      }
    }
  })
}