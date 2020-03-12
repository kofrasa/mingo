
export const literalOperators = { $literal }

/**
 * Return a value without parsing.
 * @param obj
 * @param expr
 */
export function $literal (obj, expr) {
  return expr
}
