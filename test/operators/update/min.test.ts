import { describe, expect, it } from "vitest";

import { $min } from "../../../src/operators/update";

describe("operators/update/min", () => {
  it("should use $min to compare values", () => {
    const state = { _id: 1, highScore: 800, lowScore: 200 };
    expect($min({ lowScore: 150 })(state)).toEqual(["lowScore"]);
    expect(state).toEqual({ _id: 1, highScore: 800, lowScore: 150 });
  });

  it("should set missing field to specified value", () => {
    const state = { _id: 1, highScore: 800 };
    expect($min({ lowScore: 200 })(state)).toEqual(["lowScore"]);
    expect(state).toEqual({ _id: 1, highScore: 800, lowScore: 200 });
  });

  it("should ignore greater value", () => {
    const state = { _id: 1, highScore: 800, lowScore: 200 };
    expect($min({ lowScore: 300 })(state)).toEqual([]);
    expect(state).toEqual({ _id: 1, highScore: 800, lowScore: 200 });
  });

  it("should ignore equal value", () => {
    const state = { _id: 1, highScore: 800, lowScore: 200 };
    expect($min({ lowScore: 200 })(state)).toEqual([]);
    expect(state).toEqual({ _id: 1, highScore: 800, lowScore: 200 });
  });
});
