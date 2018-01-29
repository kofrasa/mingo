import { cloneDeep } from '../../util'
import { redactObj } from '../../internal'

/**
 * Restricts the contents of the documents based on information stored in the documents themselves.
 *
 * https://docs.mongodb.com/manual/reference/operator/aggregation/redact/
 */
export function $redact (collection, expr) {
  return collection.map(obj => redactObj(cloneDeep(obj), expr))
}