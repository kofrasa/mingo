import { $push } from "../../../src/operators/update";

describe("operators/update/push", () => {
  it("Append a Value to an Array", () => {
    const state = { _id: 1, scores: [44, 78, 38, 80] };
    $push(state, { scores: 89 });
    expect(state).toEqual({ _id: 1, scores: [44, 78, 38, 80, 89] });
  });

  it("Append a Value to Arrays in Multiple Sub-Documents", () => {
    const state = {
      _id: 1,
      allScores: [
        { _id: 2, scores: [45, 78, 38, 80, 89] },
        { _id: 3, scores: [46, 78, 38, 80, 89] },
        { _id: 4, scores: [47, 78, 38, 80, 89] }
      ]
    };
    $push(state, { "allScores.scores": 95 });
    expect(state).toEqual({
      _id: 1,
      allScores: [
        { _id: 2, scores: [45, 78, 38, 80, 89, 95] },
        { _id: 3, scores: [46, 78, 38, 80, 89, 95] },
        { _id: 4, scores: [47, 78, 38, 80, 89, 95] }
      ]
    });
  });

  it("Use $push Operator with Multiple Modifiers", () => {
    const state = {
      _id: 5,
      quizzes: [
        { wk: 1, score: 10 },
        { wk: 2, score: 8 },
        { wk: 3, score: 5 },
        { wk: 4, score: 6 }
      ]
    };
    $push(state, {
      quizzes: {
        $each: [
          { wk: 5, score: 8 },
          { wk: 6, score: 7 },
          { wk: 7, score: 6 }
        ],
        $sort: { score: -1 },
        $slice: 3
      }
    });
    expect(state).toEqual({
      _id: 5,
      quizzes: [
        { wk: 1, score: 10 },
        { wk: 2, score: 8 },
        { wk: 5, score: 8 }
      ]
    });
  });

  it("should build object graph if missing", () => {
    const state = {
      _id: "1",
      name: "Celsoppe"
    };

    $push(state, {
      "attributes.scores.bar": {
        a: 1
      }
    });

    expect(state).toEqual({
      _id: "1",
      attributes: {
        scores: {
          bar: [
            {
              a: 1
            }
          ]
        }
      },
      name: "Celsoppe"
    });
  });

  describe("$slice modifier", () => {
    it("Slice from the End of the Array", () => {
      const state = { _id: 1, scores: [40, 50, 60] };
      $push(
        state,
        {
          scores: {
            $each: [80, 78, 86],
            $slice: -5
          }
        },
        []
      );
      expect(state).toEqual({ _id: 1, scores: [50, 60, 80, 78, 86] });
    });

    it("Slice from the Front of the Array", () => {
      const state = { _id: 2, scores: [89, 90] };
      $push(
        state,
        {
          scores: {
            $each: [100, 20],
            $slice: 3
          }
        },
        []
      );
      expect(state).toEqual({ _id: 2, scores: [89, 90, 100] });
    });

    it("Update Array Using Slice Only", () => {
      const state = { _id: 3, scores: [89, 70, 100, 20] };
      $push(
        state,
        {
          scores: {
            $each: [],
            $slice: -3
          }
        },
        []
      );
      expect(state).toEqual({ _id: 3, scores: [70, 100, 20] });
    });
  });

  describe("$position modifier", () => {
    it("Add Elements at the Start of the Array", () => {
      const state = { _id: 1, scores: [100] };

      $push(
        state,
        {
          scores: {
            $each: [50, 60, 70],
            $position: 0
          }
        },
        []
      );

      expect(state).toEqual({ _id: 1, scores: [50, 60, 70, 100] });
    });

    it("Add Elements to the Middle of the Array", () => {
      const state = { _id: 2, scores: [50, 60, 70, 100] };

      // now push to middle
      $push(
        state,
        {
          scores: {
            $each: [20, 30],
            $position: 2
          }
        },
        []
      );

      expect(state).toEqual({ _id: 2, scores: [50, 60, 20, 30, 70, 100] });
    });

    it("Use a Negative Index to Add Elements to the Array", () => {
      const state = { _id: 3, scores: [50, 60, 20, 30, 70, 100] };
      $push(
        state,
        {
          scores: {
            $each: [90, 80],
            $position: -2
          }
        },
        []
      );

      expect(state).toEqual({
        _id: 3,
        scores: [50, 60, 20, 30, 90, 80, 70, 100]
      });
    });
  });

  describe("$sort modifier", () => {
    it("Sort Array of Documents by a Field in the Documents", () => {
      const state = {
        _id: 1,
        quizzes: [
          { id: 1, score: 6 },
          { id: 2, score: 9 }
        ]
      };

      $push(
        state,
        {
          quizzes: {
            $each: [
              { id: 3, score: 8 },
              { id: 4, score: 7 },
              { id: 5, score: 6 }
            ],
            $sort: { score: 1 }
          }
        },
        []
      );

      expect(state).toEqual({
        _id: 1,
        quizzes: [
          { id: 1, score: 6 },
          { id: 5, score: 6 },
          { id: 4, score: 7 },
          { id: 3, score: 8 },
          { id: 2, score: 9 }
        ]
      });
    });

    it("Sort Array Elements That Are Not Documents", () => {
      const state = { _id: 2, tests: [89, 70, 89, 50] };
      $push(state, { tests: { $each: [40, 60], $sort: 1 } }, []);
      expect(state.tests).toEqual([40, 50, 60, 70, 89, 89]);
    });

    it("Update Array Using Sort Only", () => {
      const state = { _id: 3, tests: [89, 70, 100, 20] };
      expect($push(state, { tests: { $each: [], $sort: -1 } })).toEqual([
        "tests"
      ]);
      expect(state).toEqual({ _id: 3, tests: [100, 89, 70, 20] });
    });
  });
});
