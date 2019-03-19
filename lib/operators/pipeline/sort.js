import { each, groupBy, into, isEmpty, isObject, isString, keys, sortBy, compare } from '../../util'
import { resolve } from '../../internal'

/**
 * Takes all input documents and returns them in a stream of sorted documents.
 *
 * @param collection
 * @param sortKeys
 * @param  {Object} opt
 * @returns {*}
 */
export function $sort (collection, sortKeys, opt) {
  if (isEmpty(sortKeys) || !isObject(sortKeys)) return collection

  opt = opt || {}
  let cmp = compare
  let collationSpec = opt['collation']

  // use collation comparator if provided
  if (isObject(collationSpec) && isString(collationSpec.locale)) {
    cmp = collationComparator(collationSpec)
  }

  return collection.transform(coll => {
    let modifiers = keys(sortKeys)

    each(modifiers.reverse(), key => {
      let grouped = groupBy(coll, obj => resolve(obj, key))
      let sortedIndex = {}

      let indexKeys = sortBy(grouped.keys, (k, i) => {
        sortedIndex[k] = i
        return k
      }, cmp)

      if (sortKeys[key] === -1) indexKeys.reverse()
      coll = []
      each(indexKeys, k => into(coll, grouped.groups[sortedIndex[k]]))
    })

    return coll
  })
}

// MongoDB collation strength to JS localeCompare sensitivity mapping.
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/localeCompare
const COLLATION_STRENGTH = {
  // Only strings that differ in base letters compare as unequal. Examples: a ≠ b, a = á, a = A.
  1: 'base',
  //  Only strings that differ in base letters or accents and other diacritic marks compare as unequal.
  // Examples: a ≠ b, a ≠ á, a = A.
  2: 'accent',
  // Strings that differ in base letters, accents and other diacritic marks, or case compare as unequal.
  // Other differences may also be taken into consideration. Examples: a ≠ b, a ≠ á, a ≠ A
  3: 'variant',
  // case - Only strings that differ in base letters or case compare as unequal. Examples: a ≠ b, a = á, a ≠ A.
}

/**
 * Creates a comparator function for the given collation spec. See https://docs.mongodb.com/manual/reference/collation/
 *
 * @param spec {Object} The MongoDB collation spec.
 * {
 *   locale: <string>,
 *   caseLevel: <boolean>,
 *   caseFirst: <string>,
 *   strength: <int>,
 *   numericOrdering: <boolean>,
 *   alternate: <string>,
 *   maxVariable: <string>, // unsupported
 *   backwards: <boolean> // unsupported
 * }
 */
function collationComparator(spec) {

  let localeOpt = {
    sensitivity: COLLATION_STRENGTH[spec.strength || 3],
    caseFirst: spec.caseFirst === 'off' ? 'false' : (spec.caseFirst || 'false'),
    numeric: spec.numericOrdering || false,
    ignorePunctuation: spec.alternate === 'shifted'
  }

  // when caseLevel is true for strength  1:base and 2:accent, bump sensitivity to the nearest that supports case comparison
  if ((spec.caseLevel || false) === true) {
    if (localeOpt.sensitivity === 'base') localeOpt.sensitivity = 'case'
    if (localeOpt.sensitivity === 'accent') localeOpt.sensitivity = 'variant'
  }

  const collator = new Intl.Collator(spec.locale, localeOpt)

  return (a, b) => {
    // non strings
    if (!isString(a) || !isString(b)) return compare(a, b)

    // only for strings
    let i = collator.compare(a, b)
    if (i < 0) return -1
    if (i > 0) return 1
    return 0
  }
}