import * as support from "../../support";

support.runTest("operators/expression/type", {
  $toString: [
    [true, "true"],
    [false, "false"],
    [2.5, "2.5"],
    [new Date("2018-03-27T16:58:51.538Z"), "2018-03-27T16:58:51.538Z"],
  ],

  $toBool: [
    [true, true],
    [1.99999, true],
    [5, true],
    [0, false],
    [100, true],
    [new Date("2018-03-26T04:38:28.044Z"), true],
    ["false", true],
    ["", true],
    [null, null],
  ],

  $toLong: [
    ["100", 100],
    [20, 20],
  ],

  $toDate: [
    [120000000000.5, new Date("1973-10-20T21:20:00Z")],
    [1253372036000.5, new Date("2009-09-19T14:53:56Z")],
    [1100000000000, new Date("2004-11-09T11:33:20Z")],
    [-1100000000000, new Date("1935-02-22T12:26:40Z")],
    ["2018-03-20", new Date("2018-03-20T00:00:00Z")],
    ["2018-03-20 11:00:06 +0500", new Date("2018-03-20T06:00:06Z")],
  ],

  $convert: [
    // bool
    [{ input: true, to: "bool" }, true],
    [{ input: false, to: "bool" }, false],
    [{ input: 1.99999, to: "bool" }, true],
    [{ input: 5, to: "bool" }, true],
    [{ input: 0, to: "bool" }, false],
    [{ input: 100, to: "bool" }, true],
    [{ input: new Date("2018-03-26T04:38:28.044Z"), to: "bool" }, true],
    [{ input: "hello", to: "bool" }, true],
    [{ input: "false", to: "bool" }, true],
    [{ input: "", to: "bool" }, true],
    [{ input: null, to: "bool" }, null],

    // int/long
    [{ input: true, to: "int" }, 1],
    [{ input: false, to: "int" }, 0],
    [{ input: 1.99999, to: "int" }, 1],
    [{ input: 5.5, to: "int" }, 5],
    [{ input: 9223372036000.0, to: "int" }, "error", { err: true }],
    [{ input: 9223372036854775808.0, to: "long" }, "error", { err: true }],
    [
      {
        input: 9223372036000.0,
        to: "int",
        onError: "Could not convert to type integer.",
      },
      "Could not convert to type integer.",
    ],
    [{ input: 5000, to: "int" }, 5000],
    [{ input: 922337203600, to: "int" }, "error", { err: true }],
    [{ input: "-2", to: "int" }, -2],
    [{ input: "2.5", to: "int" }, "error", { err: true }],
    [{ input: null, to: "int" }, null],
    [{ input: "5e2", to: "long" }, 500],

    // decimal / double
    [{ input: true, to: "decimal" }, 1],
    [{ input: false, to: "decimal" }, 0],
    [{ input: "2.5", to: "decimal" }, 2.5],
    [{ input: 5, to: "decimal" }, 5],
    [{ input: 10000, to: "decimal" }, 10000],
    [{ input: "-5.5", to: "decimal" }, -5.5],
    [
      { input: new Date("2018-03-27T05:04:47.890Z"), to: "decimal" },
      1522127087890,
    ],
    [{ input: "5e10", to: "double" }, 50000000000],

    // date
    [{ input: 120000000000.5, to: "date" }, new Date("1973-10-20T21:20:00Z")],
    [{ input: 1253372036000.5, to: "date" }, new Date("2009-09-19T14:53:56Z")],
    [{ input: 1100000000000, to: "date" }, new Date("2004-11-09T11:33:20Z")],
    [{ input: -1100000000000, to: "date" }, new Date("1935-02-22T12:26:40Z")],
    [{ input: "2018-03-03", to: "date" }, new Date("2018-03-03T00:00:00Z")],
    [
      { input: "2018-03-20 11:00:06 +0500", to: "date" },
      new Date("2018-03-20T06:00:06Z"),
    ],
    [{ input: "Friday", to: "date" }, "error", { err: true }],
    [
      {
        input: "Friday",
        to: "date",
        onError: "Could not convert to type date.",
      },
      "Could not convert to type date.",
    ],

    // string
    [{ input: true, to: "string" }, "true"],
    [{ input: false, to: "string" }, "false"],
    [{ input: 2.5, to: "string" }, "2.5"],
    [{ input: 2, to: "string" }, "2"],
    [{ input: 1000, to: "string" }, "1000"],
    [
      { input: new Date("2018-03-27T16:58:51.538Z"), to: "string" },
      "2018-03-27T16:58:51.538Z",
    ],
  ],

  $isNumber: [
    [-0.1, true],
    [0, true],
    [1, true],
    [1.1, true],
    ["0", false],
    [NaN, false],
    [null, false],
    [undefined, false],
  ],
});
