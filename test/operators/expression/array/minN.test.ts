import * as support from "../../../support";

support.runTest(support.testPath(import.meta.url), {
  $minN: [
    ["invalid", Error("expects object")],
    [{ input: null, n: 2 }, null],
    [{ input: "not array", n: 2 }, Error("resolve to array")],
    [{ input: "not array", n: 2 }, null, { failOnError: false }],
    [{ input: [1, 2, 3], n: -2 }, Error("resolve to positive integer")],
    [{ input: [1, 2, 3], n: -2 }, null, { failOnError: false }],
    [{ input: [12, 90, 7, 89, 8], n: 2 }, [7, 8]],
    [{ input: [null], n: 2 }, []],
    [{ input: [], n: 2 }, []],
    [{ input: [1293, "2", 3489, 9], n: 2 }, [9, 1293]]
  ]
});
