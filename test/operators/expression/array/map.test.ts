import { runTest, testPath } from "../../../support";

runTest(testPath(import.meta.url), {
  $map: [
    ["invalid", Error("expects object")],
    [{ input: null, in: true }, null],
    [{ input: "not array", in: 10 }, Error("resolve to array")],
    [{ input: [], in: 10, as: 100 }, Error("resolve to string")],
    [
      { input: [5, 6, 7], as: "grade", in: { $add: ["$$grade", 2] } },
      [7, 8, 9]
    ],
    [{ input: [], as: "grade", in: { $add: ["$$grade", 2] } }, []],
    [{ input: [3, 8, 9], in: { $add: ["$$this", 2] } }, [5, 10, 11]]
  ]
});
