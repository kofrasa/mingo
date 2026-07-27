import { describe, expect, it } from "vitest";

import { aggregate } from "../../../src";
import { ProcessingMode } from "../../../src/core/_internal";
import { testPath } from "../../support";

const options = {
  processingMode: ProcessingMode.CLONE_INPUT
};

describe(testPath(import.meta.url), () => {
  it("Computes minMaxScaler over the window", () => {
    const result = aggregate(
      [{ a: 1 }, { a: 5 }, { a: 13 }, { a: 21 }],
      [
        {
          $setWindowFields: {
            sortBy: { a: 1 },
            output: {
              scaled: { $minMaxScaler: "$a" },
              scaledTo100: { $minMaxScaler: { input: "$a", min: 0, max: 100 } }
            }
          }
        }
      ],
      options
    );

    expect(result).toEqual([
      { a: 1, scaled: 0, scaledTo100: 0 },
      { a: 5, scaled: 0.2, scaledTo100: 20 },
      { a: 13, scaled: 0.6, scaledTo100: 60 },
      { a: 21, scaled: 1, scaledTo100: 100 }
    ]);
  });

  it("Throws if input is not numeric", () => {
    expect(() =>
      aggregate(
        [{ a: 1 }, { a: 5 }, { a: "x" }, { a: 21 }],
        [
          {
            $setWindowFields: {
              sortBy: { a: 1 },
              output: {
                scaled: { $minMaxScaler: "$a" }
              }
            }
          }
        ],
        options
      )
    ).toThrow("$minMaxScaler: input must be a numeric array");
  });
});
