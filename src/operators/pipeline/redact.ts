import { cloneDeep } from '../../util'
import { redactObj } from '../../internal'
import { Iterator } from '../../lazy'


/**
 * Restricts the contents of the documents based on information stored in the documents themselves.
 *
 * https://docs.mongodb.com/manual/reference/operator/aggregation/redact/
 */
export function $redact(collection: Iterator, expr: any, opt?: object): Iterator {
  return collection.map(obj => redactObj(cloneDeep(obj), expr))
}