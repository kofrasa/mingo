// Query Bitwise Operators: https://docs.mongodb.com/manual/reference/operator/query-bitwise/

import { Callback } from "../../util"

/**
 * Matches numeric or binary values in which a set of bit positions all have a value of 0.
 * @param selector
 * @param value
 */
export function $bitsAllClear(selector: string, value: any): Callback<boolean> {
  throw new Error('$bitsAllClear not implemented')
}

/**
 * Matches numeric or binary values in which a set of bit positions all have a value of 1.
 * @param selector
 * @param value
 */
export function $bitsAllSet(selector: string, value: any): Callback<boolean> {
  throw new Error('$bitsAllSet not implemented')
}

/**
 * Matches numeric or binary values in which any bit from a set of bit positions has a value of 0.
 * @param selector
 * @param value
 */
export function $bitsAnyClear(selector: string, value: any): Callback<boolean> {
  throw new Error('$bitsAnyClear not implemented')
}

/**
 * Matches numeric or binary values in which any bit from a set of bit positions has a value of 1.
 * @param selector
 * @param value
 */
export function $bitsAnySet(selector: string, value: any): Callback<boolean> {
  throw new Error('$bitsAllClear not implemented')
}

