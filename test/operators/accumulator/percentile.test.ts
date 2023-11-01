import { aggregate } from "../../../src";
import { initOptions, ProcessingMode } from "../../../src/core";
import { $percentile } from "../../../src/operators/accumulator";
import { DEFAULT_OPTS, testPath } from "../../support";

const options = initOptions({
  ...DEFAULT_OPTS,
  processingMode: ProcessingMode.CLONE_INPUT
});

describe(testPath("accumulator/percentile"), () => {
  const input = [
    { studentId: "2345", test01: 62, test02: 81, test03: 80 },
    { studentId: "2356", test01: 60, test02: 83, test03: 79 },
    { studentId: "2358", test01: 67, test02: 82, test03: 78 },
    { studentId: "2367", test01: 64, test02: 72, test03: 77 },
    { studentId: "2369", test01: 60, test02: 53, test03: 72 }
  ];
  //60 60 62 64 67
  it("Calculate a Single Value", () => {
    const result = $percentile(
      input,
      {
        input: "$test01",
        p: [0.95]
      },
      options
    );

    expect(result).toEqual([67]);
  });

  describe("Calculate Multiple Values", () => {
    it.each([
      ["$test01", [62, 64, 67, 67]],
      ["$test02", [81, 82, 83, 83]],
      ["$test03", [78, 79, 80, 80]]
    ])("should compute for %p", (expr, expected) => {
      const result = $percentile(
        input,
        {
          input: expr,
          p: [0.5, 0.75, 0.9, 0.95]
        },
        options
      );
      expect(result).toEqual(expected);
    });

    it("computes alternative percentiles", () => {
      const result = $percentile(
        input,
        {
          input: "$test03",
          p: [0.9, 0.5, 0.75, 0.95]
        },
        options
      );
      expect(result).toEqual([80, 78, 79, 80]);
    });
  });

  it("should Use $percentile in a $project Stage", () => {
    const result = aggregate(
      input,
      [
        {
          $project: {
            _id: 0,
            studentId: 1,
            testPercentiles: {
              $percentile: {
                input: ["$test01", "$test02", "$test03"],
                p: [0.5, 0.95],
                method: "approximate"
              }
            }
          }
        }
      ],
      options
    );

    expect(result).toEqual([
      { studentId: "2345", testPercentiles: [80, 81] },
      { studentId: "2356", testPercentiles: [79, 83] },
      { studentId: "2358", testPercentiles: [78, 82] },
      { studentId: "2367", testPercentiles: [72, 77] },
      { studentId: "2369", testPercentiles: [60, 72] }
    ]);
  });

  it("should Use $percentile in a $setWindowField Stage", () => {
    const result = aggregate(
      input,
      [
        {
          $setWindowFields: {
            sortBy: { test01: 1 },
            output: {
              test01_95percentile: {
                $percentile: {
                  input: "$test01",
                  p: [0.95],
                  method: "approximate"
                },
                window: {
                  range: [-3, 3]
                }
              }
            }
          }
        },
        {
          $project: {
            _id: 0,
            studentId: 1,
            test01_95percentile: 1
          }
        }
      ],
      options
    );

    expect(result).toEqual([
      { studentId: "2356", test01_95percentile: [62] },
      { studentId: "2369", test01_95percentile: [62] },
      { studentId: "2345", test01_95percentile: [64] },
      { studentId: "2367", test01_95percentile: [67] },
      { studentId: "2358", test01_95percentile: [67] }
    ]);
  });

  it.each([
    [[10], 0.1, [10, 10]],
    [[10], 0.5, [10, 10]],
    [[10], 0.9, [10, 10]],
    [[10], 1.0, [10, 10]],
    [[10, 20], 0.1, [11, 10]],
    [[10, 20], 0.5, [15, 10]],
    [[10, 20], 0.9, [19, 20]],
    [[10, 20], 1.0, [20, 20]],
    [[60, 64, 67], 0.1, [60.8, 60]],
    [[60, 64, 67], 0.5, [64, 64]],
    [[60, 64, 67], 0.9, [66.4, 67]],
    [[60, 64, 67], 1.0, [67, 67]]
  ])(
    "should compute Pct(%p,%p) => %p (exact, approximate)",
    (X, p, results) => {
      ["exact", "approximate"].forEach((method, i) => {
        expect(
          $percentile(
            X,
            { input: "$$CURRENT", p: [p], method },
            DEFAULT_OPTS
          ).pop()
        ).toEqual(results[i]);
      });
    }
  );
});
