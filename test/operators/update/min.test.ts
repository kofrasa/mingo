import { $min } from "../../../src/operators/update";

describe("operators/update/min", () => {
  it("should use $min to compare values", () => {
    const state = { _id: 1, highScore: 800, lowScore: 200 };
    expect($min(state, { lowScore: 150 })).toEqual(["lowScore"]);
    expect(state).toEqual({ _id: 1, highScore: 800, lowScore: 150 });
  });

  it("should ignore greater value", () => {
    const state = { _id: 1, highScore: 800, lowScore: 200 };
    expect($min(state, { lowScore: 300 })).toEqual([]);
    expect(state).toEqual({ _id: 1, highScore: 800, lowScore: 200 });
  });

  it("should ignore equal value", () => {
    const state = { _id: 1, highScore: 800, lowScore: 200 };
    expect($min(state, { lowScore: 200 })).toEqual([]);
    expect(state).toEqual({ _id: 1, highScore: 800, lowScore: 200 });
  });
});
