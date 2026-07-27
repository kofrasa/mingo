import { describe, expect, it } from "vitest";

import { update } from "../../../src";
import { $inc } from "../../../src/operators/update";
import { testPath } from "../../support";

describe(testPath(import.meta.url), () => {
  it("cannot increment invalid field", () => {
    const state = { _id: 1, n: "Bob" };
    expect($inc({ n: 2 })(state)).toEqual([]);
    expect(state).toEqual({ _id: 1, n: "Bob" });
  });

  it("should set field to current date", () => {
    const state = {
      _id: 1,
      sku: "abc123",
      quantity: 10,
      metrics: { orders: 2, ratings: 3.5 }
    };
    expect($inc({ quantity: -2, "metrics.orders": 1 })(state)).toEqual([
      "metrics.orders",
      "quantity"
    ]);
    expect(state).toEqual({
      _id: 1,
      sku: "abc123",
      quantity: 8,
      metrics: { orders: 3, ratings: 3.5 }
    });

    // const obj = { _id: 1, temp: "" };
    // expect($inc(obj, { "temp": 1 })).toEqual(["temp"]);
    // expect(obj).toEqual({ _id: 1, temp: "1" });
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
      $inc({ "grades.$[elem].std": -1 }, [
        { "elem.grade": { $gte: 80 }, "elem.std": { $gt: 5 } }
      ])(state);
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
    $inc({ "grades.$[t].questions.$[score]": 2 }, [
      { "t.type": "quiz" },
      { score: { $gte: 8 } }
    ])(state);
    expect(state.grades).toEqual([
      { type: "quiz", questions: [12, 10, 5] },
      { type: "quiz", questions: [10, 11, 6] },
      { type: "hw", questions: [5, 4, 3] },
      { type: "exam", questions: [25, 10, 23, 0] }
    ]);

    // update all values >=8
    $inc({ "grades.$[].questions.$[score]": 2 }, [{ score: { $gte: 8 } }])(
      state
    );
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
    const cb = $inc({ "grades.$[].std": -2 });
    states.forEach((s, i) => {
      cb(s);
      expect(s).toEqual(results[i]);
    });
  });

  it("should build object graph if missing", () => {
    const state = {
      _id: "1",
      name: "Celsoppe"
    };

    $inc({ "attributes.scores.bar": 2 })(state);

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

  describe("Nested Arrays", () => {
    it("Update All Elements in an Array", () => {
      const students = [
        { _id: 1, grades: [85, 82, 80] },
        { _id: 2, grades: [88, 90, 92] },
        { _id: 3, grades: [85, 100, 90] }
      ];

      students.forEach(obj => {
        update(obj, { $inc: { "grades.$[]": 10 } });
      });

      expect(students).toEqual([
        { _id: 1, grades: [95, 92, 90] },
        { _id: 2, grades: [98, 100, 102] },
        { _id: 3, grades: [95, 110, 100] }
      ]);
    });

    it("Update All Documents in an Array", () => {
      const students = [
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

      students.forEach(obj => {
        update(obj, { $inc: { "grades.$[].std": -2 } });
      });

      expect(students).toEqual([
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
      ]);
    });

    it("Update Arrays Specified Using a Negation Query Operator", () => {
      const data = [
        { _id: 1, grades: [85, 82, 80] },
        { _id: 2, grades: [88, 90, 92] },
        { _id: 3, grades: [85, 100, 90] }
      ];

      data.forEach(obj => {
        update(obj, { $inc: { "grades.$[]": 10 } }, null, {
          grades: { $ne: 100 }
        });
      });

      expect(data).toEqual([
        { _id: 1, grades: [95, 92, 90] },
        { _id: 2, grades: [98, 100, 102] },
        { _id: 3, grades: [85, 100, 90] }
      ]);
    });

    it("Update Nested Arrays in Conjunction with $[<identifier>]", () => {
      const data = [
        {
          _id: 1,
          grades: [
            { type: "quiz", questions: [10, 8, 5] },
            { type: "quiz", questions: [8, 9, 6] },
            { type: "hw", questions: [5, 4, 3] },
            { type: "exam", questions: [25, 10, 23, 0] }
          ]
        }
      ];

      data.forEach(obj => {
        update(obj, { $inc: { "grades.$[].questions.$[score]": 2 } }, [
          { score: { $gte: 8 } }
        ]);
      });

      expect(data).toEqual([
        {
          _id: 1,
          grades: [
            { type: "quiz", questions: [12, 10, 5] },
            { type: "quiz", questions: [10, 11, 6] },
            { type: "hw", questions: [5, 4, 3] },
            { type: "exam", questions: [27, 12, 25, 0] }
          ]
        }
      ]);
    });
  });
});
