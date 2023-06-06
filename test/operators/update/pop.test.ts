import { $pop } from "../../../src/operators/update";

describe("operators/update/pop", () => {
  it("Remove the First Item of an Array", () => {
    const state = { _id: 1, scores: [8, 9, 10] };
    expect($pop(state, { scores: -1 })).toEqual(["scores"]);
    expect(state).toEqual({ _id: 1, scores: [9, 10] });
  });

  it("Remove the Last Item of an Array", () => {
    const state = { _id: 10, scores: [9, 10] };
    $pop(state, { scores: 1 });
    expect(state).toEqual({ _id: 10, scores: [9] });
  });

  it("Remove Nothing from Empty Array", () => {
    const state = { _id: 10, scores: [] };
    expect($pop(state, { scores: 1 })).toEqual([]);
    expect(state).toEqual({ _id: 10, scores: [] });
  });
});
