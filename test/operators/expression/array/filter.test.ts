import * as support from "../../../support";

support.runTest(support.testPath(import.meta.url), {
  $filter: [
    ["invalid", Error("expects object")], // no validation for argument structure.
    [{ input: "invalid" }, Error("expects object")],
    [{ input: [] }, Error("expects object")],
    [{ input: null, cond: true }, null],
    [{ input: "invalid", cond: true }, Error("'input'")],
    [{ input: [], cond: true, limit: 0 }, Error("'limit'")],
    [{ input: [1, 2, 3, 4], limit: 2, cond: true }, [1, 2]],
    [{ input: [], limit: 2, cond: true }, []],
    [
      {
        input: [
          "string",
          "",
          1,
          0,
          1.5,
          NaN,
          undefined,
          null,
          true,
          false,
          [],
          {}
        ],
        as: "item",
        cond: "$$item"
      },
      ["string", "", 1, 1.5, true, [], {}]
    ]
  ]
});
