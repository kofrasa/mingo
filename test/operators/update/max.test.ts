import { $max } from "../../../src/operators/update";

describe("operators/update/max", () => {
  it("should take bigger value", () => {
    const state = { _id: 1, highScore: 800, lowScore: 200 };
    expect($max(state, { highScore: 950 })).toEqual(["highScore"]);
    expect(state).toEqual({ _id: 1, highScore: 950, lowScore: 200 });
  });

  it("should ignore smaller value", () => {
    const state = { _id: 1, highScore: 800, lowScore: 200 };
    expect($max(state, { highScore: 750 })).toEqual([]);
    expect(state).toEqual({ _id: 1, highScore: 800, lowScore: 200 });
  });

  it("should ignore equal value", () => {
    const state = { _id: 1, highScore: 800, lowScore: 200 };
    expect($max(state, { highScore: 800 })).toEqual([]);
    expect(state).toEqual({ _id: 1, highScore: 800, lowScore: 200 });
  });
});
