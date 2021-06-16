import test from "tape";

import { aggregate } from "../../src";
import { Collection, RawObject } from "../../src/types";

/**
 * Test for $redact operator
 * https://docs.mongodb.com/manual/reference/operator/aggregation/redact/
 */
test("$redact pipeline operator", (t) => {
  let data: Collection = [
    {
      _id: 1,
      title: "123 Department Report",
      tags: ["G", "STLW"],
      year: 2014,
      subsections: [
        {
          subtitle: "Section 1: Overview",
          tags: ["SI", "G"],
          content: "Section 1: This is the content of section 1.",
        },
        {
          subtitle: "Section 2: Analysis",
          tags: ["STLW"],
          content: "Section 2: This is the content of section 2.",
        },
        {
          subtitle: "Section 3: Budgeting",
          tags: ["TK"],
          content: {
            text: "Section 3: This is the content of section3.",
            tags: ["HCS"],
          },
        },
      ],
    },
  ];

  const userAccess = ["STLW", "G"];
  let query: Array<RawObject> = [
    { $match: { year: 2014 } },
    {
      $redact: {
        $cond: {
          if: {
            $gt: [{ $size: { $setIntersection: ["$tags", userAccess] } }, 0],
          },
          then: "$$DESCEND",
          else: "$$PRUNE",
        },
      },
    },
  ];

  let result = aggregate(data, query);

  t.deepEqual(
    result,
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
            content: "Section 1: This is the content of section 1.",
          },
          {
            subtitle: "Section 2: Analysis",
            tags: ["STLW"],
            content: "Section 2: This is the content of section 2.",
          },
        ],
      },
    ],
    "Evaluate Access at Every Document Level"
  );

  data = [
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
          city: "Some City",
        },
        shipping_addr: [
          {
            level: 3,
            addr1: "987 XYZ Ave",
            city: "Some City",
          },
          {
            level: 3,
            addr1: "PO Box 0123",
            city: "Some City",
          },
        ],
      },
      status: "A",
    },
  ];

  query = [
    { $match: { status: "A" } },
    {
      $redact: {
        $cond: {
          if: { $eq: ["$level", 5] },
          then: "$$PRUNE",
          else: "$$DESCEND",
        },
      },
    },
  ];

  result = aggregate(data, query);

  t.deepEqual(
    result,
    [
      {
        _id: 1,
        level: 1,
        acct_id: "xyz123",
        status: "A",
      },
    ],
    "Exclude All Fields at a Given Level"
  );

  t.end();
});
