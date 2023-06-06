import "../../support";

import { $pull } from "../../../src/operators/update";

describe("operators/update/pull", () => {
  it("Remove All Items That Equal a Specified Value", () => {
    const state = {
      _id: 1,
      fruits: ["apples", "pears", "oranges", "grapes", "bananas"],
      vegetables: ["carrots", "celery", "squash", "carrots"]
    };
    expect(
      $pull(state, {
        fruits: { $in: ["apples", "oranges"] },
        vegetables: "carrots"
      })
    ).toEqual(["fruits", "vegetables"]);
    expect(state).toEqual({
      _id: 1,
      fruits: ["pears", "grapes", "bananas"],
      vegetables: ["celery", "squash"]
    });
  });

  it("Remove All Items That Match a Specified $pull Condition", () => {
    const state = { _id: 1, votes: [3, 5, 6, 7, 7, 8] };
    $pull(state, { votes: { $gte: 6 } });
    expect(state).toEqual({ _id: 1, votes: [3, 5] });
  });

  it("Remove Items from an Array of Documents", () => {
    const state = {
      _id: 1,
      results: [
        { item: "A", score: 5 },
        { item: "B", score: 8 }
      ]
    };
    $pull(state, { results: { score: 8, item: "B" } });
    expect(state).toEqual({ _id: 1, results: [{ item: "A", score: 5 }] });
  });
});
