import "../../../src/init/system";

import { aggregate } from "../../../src";
import { initOptions, ProcessingMode } from "../../../src/core";
import { RawObject } from "../../../src/types";

const options = initOptions({ processingMode: ProcessingMode.CLONE_INPUT });

describe("operators/pipeline/merge", () => {
  describe("On-Demand Materialized View", () => {
    const budgets = [];
    const salaries = [
      {
        _id: 1,
        employee: "Ant",
        dept: "A",
        salary: 100000,
        fiscal_year: 2017
      },
      {
        _id: 2,
        employee: "Bee",
        dept: "A",
        salary: 120000,
        fiscal_year: 2017
      },
      {
        _id: 3,
        employee: "Cat",
        dept: "Z",
        salary: 115000,
        fiscal_year: 2017
      },
      {
        _id: 4,
        employee: "Ant",
        dept: "A",
        salary: 115000,
        fiscal_year: 2018
      },
      {
        _id: 5,
        employee: "Bee",
        dept: "Z",
        salary: 145000,
        fiscal_year: 2018
      },
      {
        _id: 6,
        employee: "Cat",
        dept: "Z",
        salary: 135000,
        fiscal_year: 2018
      },
      {
        _id: 7,
        employee: "Gecko",
        dept: "A",
        salary: 100000,
        fiscal_year: 2018
      },
      {
        _id: 8,
        employee: "Ant",
        dept: "A",
        salary: 125000,
        fiscal_year: 2019
      },
      {
        _id: 9,
        employee: "Bee",
        dept: "Z",
        salary: 160000,
        fiscal_year: 2019
      },
      {
        _id: 10,
        employee: "Cat",
        dept: "Z",
        salary: 150000,
        fiscal_year: 2019
      }
    ];

    it("Initial Creation", () => {
      aggregate(
        salaries,
        [
          {
            $group: {
              _id: { fiscal_year: "$fiscal_year", dept: "$dept" },
              salaries: { $sum: "$salary" }
            }
          },
          {
            $merge: {
              into: budgets,
              on: "_id",
              whenMatched: "replace",
              whenNotMatched: "insert"
            }
          }
        ],
        options
      );

      expect(budgets).toStrictEqual([
        { _id: { fiscal_year: 2017, dept: "A" }, salaries: 220000 },
        { _id: { fiscal_year: 2017, dept: "Z" }, salaries: 115000 },
        { _id: { fiscal_year: 2018, dept: "A" }, salaries: 215000 },
        { _id: { fiscal_year: 2018, dept: "Z" }, salaries: 280000 },
        { _id: { fiscal_year: 2019, dept: "A" }, salaries: 125000 },
        { _id: { fiscal_year: 2019, dept: "Z" }, salaries: 310000 }
      ]);
    });

    it("Update/Replace Data", () => {
      aggregate(
        salaries.concat([
          {
            _id: 11,
            employee: "Wren",
            dept: "Z",
            salary: 100000,
            fiscal_year: 2019
          },
          {
            _id: 12,
            employee: "Zebra",
            dept: "A",
            salary: 150000,
            fiscal_year: 2019
          },
          {
            _id: 13,
            employee: "headcount1",
            dept: "Z",
            salary: 120000,
            fiscal_year: 2020
          },
          {
            _id: 14,
            employee: "headcount2",
            dept: "Z",
            salary: 120000,
            fiscal_year: 2020
          }
        ]),
        [
          { $match: { fiscal_year: { $gte: 2019 } } },
          {
            $group: {
              _id: { fiscal_year: "$fiscal_year", dept: "$dept" },
              salaries: { $sum: "$salary" }
            }
          },
          {
            $merge: {
              into: budgets,
              on: "_id",
              whenMatched: "replace",
              whenNotMatched: "insert"
            }
          }
        ],
        options
      );

      expect(budgets).toStrictEqual([
        { _id: { fiscal_year: 2017, dept: "A" }, salaries: 220000 },
        { _id: { fiscal_year: 2017, dept: "Z" }, salaries: 115000 },
        { _id: { fiscal_year: 2018, dept: "A" }, salaries: 215000 },
        { _id: { fiscal_year: 2018, dept: "Z" }, salaries: 280000 },
        { _id: { fiscal_year: 2019, dept: "A" }, salaries: 275000 },
        { _id: { fiscal_year: 2019, dept: "Z" }, salaries: 410000 },
        { _id: { fiscal_year: 2020, dept: "Z" }, salaries: 240000 }
      ]);
    });

    it("Only Insert New Data", () => {
      const orgArchive = [
        {
          employees: ["Ant", "Gecko"],
          dept: "A",
          fiscal_year: 2018
        },
        {
          employees: ["Ant", "Bee"],
          dept: "A",
          fiscal_year: 2017
        },
        {
          employees: ["Bee", "Cat"],
          dept: "Z",
          fiscal_year: 2018
        },
        {
          employees: ["Cat"],
          dept: "Z",
          fiscal_year: 2017
        }
      ];

      aggregate(
        salaries.concat([
          {
            _id: 11,
            employee: "Wren",
            dept: "Z",
            salary: 100000,
            fiscal_year: 2019
          },
          {
            _id: 12,
            employee: "Zebra",
            dept: "A",
            salary: 150000,
            fiscal_year: 2019
          }
        ]),
        [
          { $match: { fiscal_year: 2019 } },
          {
            $group: {
              _id: { fiscal_year: "$fiscal_year", dept: "$dept" },
              employees: { $push: "$employee" }
            }
          },
          {
            $project: {
              _id: 0,
              dept: "$_id.dept",
              fiscal_year: "$_id.fiscal_year",
              employees: 1
            }
          },
          {
            $merge: {
              into: orgArchive,
              on: ["dept", "fiscal_year"],
              whenMatched: "fail"
            }
          }
        ],
        options
      );

      expect(orgArchive).toStrictEqual([
        { employees: ["Ant", "Gecko"], dept: "A", fiscal_year: 2018 },
        { employees: ["Ant", "Bee"], dept: "A", fiscal_year: 2017 },
        { employees: ["Bee", "Cat"], dept: "Z", fiscal_year: 2018 },
        { employees: ["Cat"], dept: "Z", fiscal_year: 2017 },
        { employees: ["Ant", "Zebra"], dept: "A", fiscal_year: 2019 },
        { employees: ["Bee", "Cat", "Wren"], dept: "Z", fiscal_year: 2019 }
      ]);
    });
  });

  it("Merge Results from Multiple Collections", () => {
    const quarterlyreport: RawObject[] = [];
    const purchaseorders = [
      {
        _id: 1,
        quarter: "2019Q1",
        region: "A",
        qty: 200,
        reportDate: new Date("2019-04-01")
      },
      {
        _id: 2,
        quarter: "2019Q1",
        region: "B",
        qty: 300,
        reportDate: new Date("2019-04-01")
      },
      {
        _id: 3,
        quarter: "2019Q1",
        region: "C",
        qty: 700,
        reportDate: new Date("2019-04-01")
      },
      {
        _id: 4,
        quarter: "2019Q2",
        region: "B",
        qty: 300,
        reportDate: new Date("2019-07-01")
      },
      {
        _id: 5,
        quarter: "2019Q2",
        region: "C",
        qty: 1000,
        reportDate: new Date("2019-07-01")
      },
      {
        _id: 6,
        quarter: "2019Q2",
        region: "A",
        qty: 400,
        reportDate: new Date("2019-07-01")
      }
    ];
    aggregate(
      purchaseorders,
      [
        { $group: { _id: "$quarter", purchased: { $sum: "$qty" } } }, // group purchase orders by quarter
        {
          $merge: {
            into: quarterlyreport,
            on: "_id",
            whenMatched: "merge",
            whenNotMatched: "insert"
          }
        }
      ],
      options
    );

    expect(quarterlyreport).toStrictEqual([
      { _id: "2019Q1", purchased: 1200 },
      { _id: "2019Q2", purchased: 1700 }
    ]);

    const reportedsales = [
      {
        _id: 1,
        quarter: "2019Q1",
        region: "A",
        qty: 400,
        reportDate: new Date("2019-04-02")
      },
      {
        _id: 2,
        quarter: "2019Q1",
        region: "B",
        qty: 550,
        reportDate: new Date("2019-04-02")
      },
      {
        _id: 3,
        quarter: "2019Q1",
        region: "C",
        qty: 1000,
        reportDate: new Date("2019-04-05")
      },
      {
        _id: 4,
        quarter: "2019Q2",
        region: "B",
        qty: 500,
        reportDate: new Date("2019-07-02")
      }
    ];

    aggregate(reportedsales, [
      { $group: { _id: "$quarter", sales: { $sum: "$qty" } } }, // group sales by quarter
      {
        $merge: {
          into: quarterlyreport,
          on: "_id",
          whenMatched: "merge",
          whenNotMatched: "insert"
        }
      }
    ]);

    expect(quarterlyreport).toStrictEqual([
      { _id: "2019Q1", sales: 1950, purchased: 1200 },
      { _id: "2019Q2", sales: 500, purchased: 1700 }
    ]);
  });

  it("Use the Pipeline to Customize the Merge", () => {
    const votes = [
      { date: new Date("2019-05-01"), thumbsup: 1, thumbsdown: 1 },
      { date: new Date("2019-05-02"), thumbsup: 3, thumbsdown: 1 },
      { date: new Date("2019-05-03"), thumbsup: 1, thumbsdown: 1 },
      { date: new Date("2019-05-04"), thumbsup: 2, thumbsdown: 2 },
      { date: new Date("2019-05-05"), thumbsup: 6, thumbsdown: 10 },
      { date: new Date("2019-05-06"), thumbsup: 13, thumbsdown: 16 },
      { date: new Date("2019-05-07"), thumbsup: 14, thumbsdown: 10 }
    ];
    const monthlytotals = [{ _id: "2019-05", thumbsup: 26, thumbsdown: 31 }];

    aggregate(votes, [
      {
        $match: {
          date: { $gte: new Date("2019-05-07"), $lt: new Date("2019-05-08") }
        }
      },
      {
        $project: {
          _id: { $dateToString: { format: "%Y-%m", date: "$date" } },
          thumbsup: 1,
          thumbsdown: 1
        }
      },
      {
        $merge: {
          into: monthlytotals,
          on: "_id",
          whenMatched: [
            {
              $addFields: {
                thumbsup: { $add: ["$thumbsup", "$$new.thumbsup"] },
                thumbsdown: { $add: ["$thumbsdown", "$$new.thumbsdown"] }
              }
            }
          ],
          whenNotMatched: "insert"
        }
      }
    ]);

    expect(monthlytotals).toStrictEqual([
      { _id: "2019-05", thumbsup: 40, thumbsdown: 41 }
    ]);
  });

  it("Use Variables to Customize the Merge", () => {
    const cakeSales = [
      { _id: 1, flavor: "chocolate", salesTotal: 1580, salesTrend: "up" }
    ];

    aggregate(cakeSales, [
      {
        $merge: {
          into: cakeSales,
          let: { year: "2020" },
          whenMatched: [
            {
              $addFields: { salesYear: "$$year" }
            }
          ]
        }
      }
    ]);

    expect(cakeSales).toStrictEqual([
      {
        _id: 1,
        flavor: "chocolate",
        salesTotal: 1580,
        salesTrend: "up",
        salesYear: "2020"
      }
    ]);
  });

  it("Fail 'whenMatched' with 'fail' option", () => {
    expect(() =>
      aggregate(
        [
          { name: "Alice", age: 10 },
          { name: "Bob", age: 15 },
          { name: "Charlie", age: 20 }
        ],
        [
          {
            $merge: {
              into: [
                { name: "Alice", age: 10 },
                { name: "Bob", age: 15 },
                { name: "Charlie", age: 20 }
              ],
              on: ["age"],
              whenMatched: "fail"
            }
          }
        ]
      )
    ).toThrowError();
  });

  it("Fail 'whenNotMatched' with 'fail' option", () => {
    const output = [
      { name: "Alice", age: 10 },
      { name: "Bob", age: 15 },
      { name: "Charlie", age: 21 }
    ];
    const options = initOptions({
      collectionResolver: (_: string) => output
    });
    expect(() =>
      aggregate(
        [
          { name: "Alice", age: 10 },
          { name: "Bob", age: 15 },
          { name: "Charlie", age: 20 }
        ],
        [
          {
            $merge: {
              into: "output",
              on: ["age"],
              whenNotMatched: "fail"
            }
          }
        ],
        options
      )
    ).toThrowError();
  });

  it("Discard 'whenNotMatched' with 'discard' option", () => {
    const output = [
      { name: "Alison", age: 10 },
      { name: "Bobby", age: 17 }
    ];
    const options = initOptions({
      collectionResolver: (_: string) => output
    });
    aggregate(
      [
        { name: "Alice", age: 10, height: 80 },
        { name: "Bob", age: 15 },
        { name: "Charlie", age: 20 }
      ],
      [
        {
          $merge: {
            into: "output",
            on: ["age"],
            whenMatched: "merge",
            whenNotMatched: "discard"
          }
        }
      ],
      options
    );

    expect(output).toStrictEqual([
      { name: "Alice", age: 10, height: 80 },
      { name: "Bobby", age: 17 }
    ]);
  });

  it("Keep 'whenMatched' with 'keepExisting' option", () => {
    const output = [
      { name: "Alison", age: 10 },
      { name: "Bobby", age: 17 }
    ];
    const options = initOptions({
      collectionResolver: (_: string) => output
    });

    aggregate(
      [
        { name: "Alice", age: 10 },
        { name: "Bob", age: 15 },
        { name: "Charlie", age: 20 }
      ],
      [
        {
          $merge: {
            into: "output",
            on: ["age"],
            whenMatched: "keepExisting",
            whenNotMatched: "insert"
          }
        }
      ],
      options
    );

    expect(output).toStrictEqual([
      { name: "Alison", age: 10 },
      { name: "Bobby", age: 17 },
      { name: "Bob", age: 15 },
      { name: "Charlie", age: 20 }
    ]);
  });
});
