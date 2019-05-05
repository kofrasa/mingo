import { $addToSet } from './addToSet'
import { $avg } from './avg'
import { $first } from './first'
import { $last } from './last'
import { $max } from './max'
import { $mergeObjects } from './mergeObjects'
import { $min } from './min'
import { $push } from './push'
import { $stdDevPop } from './stdDevPop'
import { $stdDevSamp } from './stdDevSamp'
import { $sum } from './sum'

/**
 * Group stage Accumulator Operators. https://docs.mongodb.com/manual/reference/operator/aggregation-
 */

export const groupOperators = {
  $addToSet,
  $avg,
  $first,
  $last,
  $mergeObjects,
  $max,
  $min,
  $push,
  $stdDevPop,
  $stdDevSamp,
  $sum
}
