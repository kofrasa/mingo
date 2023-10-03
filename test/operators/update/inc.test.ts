import "../../support";

import { $inc } from "../../../src/operators/update";

describe("operators/update/inc", () => {
  it("should set field to current date", () => {
    const state = {
      _id: 1,
      sku: "abc123",
      quantity: 10,
      metrics: { orders: 2, ratings: 3.5 }
    };
    expect($inc(state, { quantity: -2, "metrics.orders": 1 })).toEqual([
      "quantity",
      "metrics.orders"
    ]);
    expect(state).toEqual({
      _id: 1,
      sku: "abc123",
      quantity: 8,
      metrics: { orders: 3, ratings: 3.5 }
    });
  });

  it("Update All Array Elements that Match Multiple Conditions", () => {
    const states = [
      {
        _id: 1,
        grades: [
          { grade: 80, mean: 75, std: 6 },
          { grade: 85, mean: 100, std: 4 },
          { grade: 85, mean: 100, std: 6 }
        ]
      },
      {
        _id: 2,
        grades: [
          { grade: 90, mean: 100, std: 6 },
          { grade: 87, mean: 100, std: 3 },
          { grade: 85, mean: 100, std: 4 }
        ]
      }
    ];
    const results = [
      {
        _id: 1,
        grades: [
          { grade: 80, mean: 75, std: 5 },
          { grade: 85, mean: 100, std: 4 },
          { grade: 85, mean: 100, std: 5 }
        ]
      },
      {
        _id: 2,
        grades: [
          { grade: 90, mean: 100, std: 5 },
          { grade: 87, mean: 100, std: 3 },
          { grade: 85, mean: 100, std: 4 }
        ]
      }
    ];

    for (let i = 0; i < states.length; i++) {
      const state = states[i];
      const expected = results[i];
      $inc(state, { "grades.$[elem].std": -1 }, [
        { "elem.grade": { $gte: 80 }, "elem.std": { $gt: 5 } }
      ]);
      expect(state).toEqual(expected);
    }
  });

  it("Update Nested Arrays in Conjunction with $[]", () => {
    const state = {
      _id: 1,
      grades: [
        { type: "quiz", questions: [10, 8, 5] },
        { type: "quiz", questions: [8, 9, 6] },
        { type: "hw", questions: [5, 4, 3] },
        { type: "exam", questions: [25, 10, 23, 0] }
      ]
    };
    $inc(state, { "grades.$[t].questions.$[score]": 2 }, [
      { "t.type": "quiz" },
      { score: { $gte: 8 } }
    ]);
    expect(state.grades).toEqual([
      { type: "quiz", questions: [12, 10, 5] },
      { type: "quiz", questions: [10, 11, 6] },
      { type: "hw", questions: [5, 4, 3] },
      { type: "exam", questions: [25, 10, 23, 0] }
    ]);

    // update all values >=8
    $inc(state, { "grades.$[].questions.$[score]": 2 }, [
      { score: { $gte: 8 } }
    ]);
    expect(state.grades).toEqual([
      { type: "quiz", questions: [14, 12, 5] },
      { type: "quiz", questions: [12, 13, 6] },
      { type: "hw", questions: [5, 4, 3] },
      { type: "exam", questions: [27, 12, 25, 0] }
    ]);
  });

  it("Update All Elements in an Array", () => {
    const states = [
      {
        _id: 1,
        grades: [
          { grade: 80, mean: 75, std: 8 },
          { grade: 85, mean: 90, std: 6 },
          { grade: 85, mean: 85, std: 8 }
        ]
      },
      {
        _id: 2,
        grades: [
          { grade: 90, mean: 75, std: 8 },
          { grade: 87, mean: 90, std: 5 },
          { grade: 85, mean: 85, std: 6 }
        ]
      }
    ];
    const results = [
      {
        _id: 1,
        grades: [
          { grade: 80, mean: 75, std: 6 },
          { grade: 85, mean: 90, std: 4 },
          { grade: 85, mean: 85, std: 6 }
        ]
      },
      {
        _id: 2,
        grades: [
          { grade: 90, mean: 75, std: 6 },
          { grade: 87, mean: 90, std: 3 },
          { grade: 85, mean: 85, std: 4 }
        ]
      }
    ];
    states.forEach((s, i) => {
      $inc(s, { "grades.$[].std": -2 });
      expect(s).toEqual(results[i]);
    });
  });

  it("should build object graph if missing", () => {
    const state = {
      _id: "1",
      name: "Celsoppe"
    };

    $inc(state, {
      "attributes.scores.bar": 2
    });

    expect(state).toEqual({
      _id: "1",
      attributes: {
        scores: {
          bar: 2
        }
      },
      name: "Celsoppe"
    });
  });
});
