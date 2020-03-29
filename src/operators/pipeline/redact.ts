import { cloneDeep } from '../../util'
import { redact } from '../../internal'
import { Iterator } from '../../lazy'


/**
 * Restricts the contents of the documents based on information stored in the documents themselves.
 *
 * https://docs.mongodb.com/manual/reference/operator/aggregation/redact/
 */
export function $redact(collection: Iterator, expr: any, opt?: object): Iterator {
  return collection.map(obj => redact(cloneDeep(obj), expr))
}