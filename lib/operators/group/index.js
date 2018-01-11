import { $addToSet } from './addToSet.js'
import { $avg } from './avg.js'
import { $first } from './first.js'
import { $last } from './last.js'
import { $max } from './max.js'
import { $mergeObjects } from './mergeObjects.js'
import { $min } from './min.js'
import { $push } from './push.js'
import { $stdDevPop } from './stdDevPop.js'
import { $stdDevSamp } from './stdDevSamp.js'
import { $sum } from './sum.js'

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
