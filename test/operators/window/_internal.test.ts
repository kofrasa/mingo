import { describe, expect, it } from "vitest";

import { cached, withMemo } from "../../../src/operators/window/_internal";
import { Any } from "../../../src/types";
import { testPath } from "../../support";

describe(testPath(import.meta.url), () => {
  describe("withMemo", () => {
    it("cleanup cache key on last document", () => {
      const coll = [{ n: 1 }, { n: 2 }];
      const f = (i: number, k: string) =>
        withMemo(
          coll,
          {
            field: k,
            documentNumber: i + 1
          },
          () => ["a", "b"] /**/,
          (xs: Any[]) => xs[i]
        );
      expect(f(0, "A")).toBe("a");
      expect(cached(coll)).toBe(true);
      expect(f(0, "B")).toBe("a");
      // last item for key "A"
      expect(f(1, "A")).toBe("b");
      expect(cached(coll)).toBe(true);
      // last item for key "B"
      expect(f(1, "B")).toBe("b");
      expect(cached(coll)).toBe(false);
    });

    it("cleanup cache key on processing failure", () => {
      const coll = [{ n: 1 }, { n: 2 }, { n: 3 }];
      withMemo(
        coll,
        {
          field: "A",
          documentNumber: 0
        },
        () => [1, 4, 9],
        (xs: Any[]) => xs[0]
      );
      expect(cached(coll)).toBe(true);
      expect(() =>
        // fail execution
        withMemo(
          coll,
          {
            field: "B",
            documentNumber: 0
          },
          () => [],
          (_: Any[]) => {
            throw new Error("bad"); // something went wrong
          }
        )
      ).toThrow(/bad/);
      expect(cached(coll)).toBe(false);
    });
  });
});
