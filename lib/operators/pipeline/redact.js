import { clone, map } from '../../util'
import { redactObj } from '../../internal'

/**
 * Restricts the contents of the documents based on information stored in the documents themselves.
 *
 * https://docs.mongodb.com/manual/reference/operator/aggregation/redact/
 */
export function $redact (collection, expr) {
  return map(collection, (obj) => redactObj(clone(obj), expr))
}