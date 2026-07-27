import { runTest, testPath } from "../../../support";

runTest(testPath(import.meta.url), {
  $maxN: [
    ["invalid", Error("expects object")],
    [{ input: null, n: 2 }, null],
    [{ input: "not array", n: 2 }, Error("resolve to array")],
    [{ input: "not array", n: 2 }, null, { failOnError: false }],
    [{ input: [1, 2, 3], n: -2 }, Error("resolve to positive integer")],
    [{ input: [1, 2, 3], n: -2 }, null, { failOnError: false }],
    [{ input: [1, 2, 3], n: 2 }, [3, 2]],
    [{ input: [null], n: 2 }, []],
    [{ input: [], n: 2 }, []],
    [{ input: [1293, "2", 3489, 9], n: 2 }, ["2", 3489]]
  ]
});
