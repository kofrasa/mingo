import { Options, QueryOperator } from "../../../core";
import { createQueryOperator } from "../../_predicates";

type Bitmask = number | number[];

export const createBitwiseOperator = (
  predicate: (_1: number, _2: number) => boolean
): QueryOperator => {
  return createQueryOperator(
    (value: number, mask: Bitmask, options: Options): boolean => {
      let b = 0;
      if (mask instanceof Array) {
        for (const n of mask) b = b | (1 << n);
      } else {
        b = mask;
      }
      return predicate(value & b, b);
    }
  );
};
