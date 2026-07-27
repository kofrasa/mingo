import { Any, Options } from "../../../types";
import { isArray } from "../../../util";
import { processQuery } from "../../_predicates";

type Bitmask = number | number[];

export const processBitwiseQuery = (
  selector: string,
  value: Any,
  options: Options,
  predicate: (_1: number, _2: number) => boolean
) => {
  return processQuery(
    selector,
    value,
    options,
    (value: number, mask: Bitmask, _opts: Options): boolean => {
      let b = 0;
      if (isArray(mask)) {
        for (const n of mask) b = b | (1 << n);
      } else {
        b = mask;
      }
      return predicate(value & b, b);
    }
  );
};
