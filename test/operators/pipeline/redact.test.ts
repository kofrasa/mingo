import { describe, expect, it } from "vitest";

import { aggregate, ProcessingMode } from "../../../src";
import { testPath } from "../../support";

/**
 * Test for $redact operator
 * https://docs.mongodb.com/manual/reference/operator/aggregation/redact/
 */
describe(testPath(import.meta.url), () => {
  describe("redact variables", () => {
    const obj = [{ name: "Francis" }];
    const opts = { processingMode: ProcessingMode.CLONE_INPUT };

    it("returns object with $$KEEP", () => {
      const result = aggregate(obj, [{ $redact: "$$KEEP" }]);
      expect(result).toStrictEqual(obj);
    });

    it("discards object with $$PRUNE", () => {
      const result = aggregate(obj, [{ $redact: "$$PRUNE" }], opts);
      expect(result).toStrictEqual([undefined]);
    });

    it("return input object for $$DESCEND if operator is not $cond", () => {
      const input = [{ name: "Francis", level: "$$DESCEND" }];
      const result = aggregate(input, [{ $redact: "$level" }], opts);
      expect(result).toStrictEqual(input);
    });

    it("ignore and return resolved value if not valid redact variable", () => {
      const result = aggregate(obj, [{ $redact: "unknown" }], opts);
      expect(result).toStrictEqual(["unknown"]);
    });
  });

  it("Evaluate Access at Every Document Level", () => {
    const res = aggregate(
      [
        {
          _id: 1,
          title: "123 Department Report",
          tags: ["G", "STLW"],
          year: 2014,
          subsections: [
            {
              subtitle: "Section 1: Overview",
              tags: ["SI", "G"],
              content: "Section 1: This is the content of section 1."
            },
            {
              subtitle: "Section 2: Analysis",
              tags: ["STLW"],
              content: "Section 2: This is the content of section 2."
            },
            {
              subtitle: "Section 3: Budgeting",
              tags: ["TK"],
              content: {
                text: "Section 3: This is the content of section3.",
                tags: ["HCS"]
              }
            }
          ]
        }
      ],
      [
        { $match: { year: 2014 } },
        {
          $redact: {
            $cond: {
              if: {
                $gt: [
                  { $size: { $setIntersection: ["$tags", ["STLW", "G"]] } },
                  0
                ]
              },
              then: "$$DESCEND",
              else: "$$PRUNE"
            }
          }
        }
      ]
    );

    expect(res).toEqual([
      {
        _id: 1,
        title: "123 Department Report",
        tags: ["G", "STLW"],
        year: 2014,
        subsections: [
          {
            subtitle: "Section 1: Overview",
            tags: ["SI", "G"],
            content: "Section 1: This is the content of section 1."
          },
          {
            subtitle: "Section 2: Analysis",
            tags: ["STLW"],
            content: "Section 2: This is the content of section 2."
          }
        ]
      }
    ]);
  });

  it("Exclude All Fields at a Given Level", () => {
    const res = aggregate(
      [
        {
          _id: 1,
          level: 1,
          acct_id: "xyz123",
          cc: {
            level: 5,
            type: "yy",
            num: 0,
            exp_date: new Date("2015-11-01T00:00:00.000Z"),
            billing_addr: {
              level: 5,
              addr1: "123 ABC Street",
              city: "Some City"
            },
            shipping_addr: [
              {
                level: 3,
                addr1: "987 XYZ Ave",
                city: "Some City"
              },
              {
                level: 3,
                addr1: "PO Box 0123",
                city: "Some City"
              }
            ]
          },
          status: "A"
        }
      ],
      [
        { $match: { status: "A" } },
        {
          $redact: {
            $cond: {
              if: { $eq: ["$level", 5] },
              then: "$$PRUNE",
              else: "$$DESCEND"
            }
          }
        }
      ]
    );
    expect(res).toEqual([
      {
        _id: 1,
        level: 1,
        acct_id: "xyz123",
        status: "A"
      }
    ]);
  });
});
