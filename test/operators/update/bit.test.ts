import "../../support";

import { $bit } from "../../../src/operators/update";

describe("operators/update/bit", () => {
  it("should apply bitwise AND, OR, XOR on values.", () => {
    const state = {
      AND: [13, 3, 1],
      OR: [13, 3, 1],
      XOR: [13, 3, 1]
    };
    expect(
      $bit(state, {
        "AND.$[]": { and: 10 },
        "OR.$[]": { or: 5 },
        "XOR.$[]": { xor: 5 }
      })
    ).toEqual(["AND", "OR", "XOR"]);
    expect(state).toEqual({
      AND: [8, 2, 0],
      OR: [13, 7, 5],
      XOR: [8, 6, 4]
    });
  });

  it("should build object graph for missing value.", () => {
    const state = {
      _id: 1
    };

    $bit(state, {
      "a.and": { and: 5 },
      "b.or": { or: 5 },
      "c.xor": { xor: 5 }
    });

    expect(state).toEqual({
      _id: 1,
      a: { and: 0 },
      b: { or: 5 },
      c: { xor: 5 }
    });
  });
});
