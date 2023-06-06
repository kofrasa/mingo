import "../../support";

import { $pullAll } from "../../../src/operators/update";

describe("operators/update/pullAll", () => {
  it("should $pullAll matching values", () => {
    const state = { _id: 1, scores: [0, 2, 5, 5, 1, 0] };
    expect($pullAll(state, { scores: [0, 5] })).toEqual(["scores"]);
    expect(state).toEqual({ _id: 1, scores: [2, 1] });
  });
});
