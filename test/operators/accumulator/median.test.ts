import { aggregate } from "../../../src";
import { initOptions, ProcessingMode } from "../../../src/core";
import { DEFAULT_OPTS, testPath } from "../../support";

const options = initOptions({
  ...DEFAULT_OPTS,
  processingMode: ProcessingMode.CLONE_INPUT
});

describe(testPath("accumulator/median"), () => {
  const input = [
    { studentId: "2345", test01: 62, test02: 81, test03: 80 },
    { studentId: "2356", test01: 60, test02: 83, test03: 79 },
    { studentId: "2358", test01: 67, test02: 82, test03: 78 },
    { studentId: "2367", test01: 64, test02: 72, test03: 77 },
    { studentId: "2369", test01: 60, test02: 53, test03: 72 }
  ];
  it("Use $median as an Accumulator", () => {
    const result = aggregate(
      input,
      [
        {
          $group: {
            _id: null,
            test01_median: {
              $median: {
                input: "$test01",
                method: "approximate"
              }
            }
          }
        }
      ],
      options
    );

    expect(result).toEqual([{ _id: null, test01_median: 62 }]);
  });

  it("Use $median in a $project Stage", () => {
    const result = aggregate(
      input,
      [
        {
          $project: {
            _id: 0,
            studentId: 1,
            testMedians: {
              $median: {
                input: ["$test01", "$test02", "$test03"],
                method: "approximate"
              }
            }
          }
        }
      ],
      options
    );

    expect(result).toEqual([
      { studentId: "2345", testMedians: 80 },
      { studentId: "2356", testMedians: 79 },
      { studentId: "2358", testMedians: 78 },
      { studentId: "2367", testMedians: 72 },
      { studentId: "2369", testMedians: 60 }
    ]);
  });

  it("Use $median in a $setWindowField Stage", () => {
    const result = aggregate(
      input,
      [
        {
          $setWindowFields: {
            sortBy: { test01: 1 },
            output: {
              test01_median: {
                $median: {
                  input: "$test01",
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
            test01_median: 1
          }
        }
      ],
      options
    );

    expect(result).toEqual([
      { studentId: "2356", test01_median: 60 },
      { studentId: "2369", test01_median: 60 },
      { studentId: "2345", test01_median: 60 },
      { studentId: "2367", test01_median: 64 },
      { studentId: "2358", test01_median: 64 }
    ]);
  });
});
