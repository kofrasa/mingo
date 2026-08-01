import { describe, expect, it } from "vitest";

import { $bit } from "../../../src/operators/update";

describe("operators/update/bit", () => {
  it("should skip operation if value is not a number.", () => {
    const state = { name: "hello" };
    expect($bit({ name: { and: 10 } })(state)).toEqual([]);
    expect(state).toEqual({ name: "hello" });
  });

  it("should apply bitwise AND, OR, XOR on values.", () => {
    const state = { AND: [13, 3, 1], OR: [13, 3, 1], XOR: [13, 3, 1] };
    expect(
      $bit({
        "AND.$[]": { and: 10 },
        "OR.$[]": { or: 5 },
        "XOR.$[]": { xor: 5 }
      })(state)
    ).toEqual(["AND", "OR", "XOR"]);
    expect(state).toEqual({ AND: [8, 2, 0], OR: [13, 7, 5], XOR: [8, 6, 4] });
  });

  it("should build object graph for missing value.", () => {
    const state = { _id: 1 };

    $bit({
      "a.and": { and: 5 },
      "b.or": { or: 5 },
      "c.xor": { xor: 5 }
    })(state);
    expect(state).toEqual({
      _id: 1,
      a: { and: 0 },
      b: { or: 5 },
      c: { xor: 5 }
    });
  });

  it("should report missing field updates that resolve to zero", () => {
    const state = { _id: 1 };

    expect(
      $bit({
        "a.and": { and: 5 },
        "b.or": { or: 0 },
        "c.xor": { xor: 0 }
      })(state)
    ).toEqual(["a.and", "b.or", "c.xor"]);
    expect(state).toEqual({
      _id: 1,
      a: { and: 0 },
      b: { or: 0 },
      c: { xor: 0 }
    });
  });

  it("should returns null if value is not a number.", () => {
    const state = { _id: 1 };

    $bit({ "a.and": { and: 5 }, "b.or": { or: 5 }, "c.xor": { xor: 5 } })(
      state
    );
    expect(state).toEqual({
      _id: 1,
      a: { and: 0 },
      b: { or: 5 },
      c: { xor: 5 }
    });
  });
});
