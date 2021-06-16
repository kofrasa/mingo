import test from "tape";

import { aggregate } from "../../src";
import * as support from "../support";

support.runTest("Type operators", {
  $toString: [
    [true, "true"],
    [false, "false"],
    [2.5, "2.5"],
    [new Date("2018-03-27T16:58:51.538Z"), "2018-03-27T16:58:51.538Z"],
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

test("Type Conversion: $toBool", (t) => {
  const data = [
    { _id: 1, item: "apple", qty: 5, shipped: true },
    { _id: 2, item: "pie", qty: 10, shipped: 0 },
    { _id: 3, item: "ice cream", shipped: 1 },
    { _id: 4, item: "almonds", qty: 2, shipped: "true" },
    { _id: 5, item: "pecans", shipped: "false" }, // Note: All strings convert to true
    { _id: 6, item: "nougat", shipped: "" }, // Note: All strings convert to true
  ];

  // Define stage to add convertedShippedFlag field with the converted shipped value
  // Because all strings convert to true, include specific handling for "false" and ""
  const shippedConversionStage = {
    $addFields: {
      convertedShippedFlag: {
        $switch: {
          branches: [
            { case: { $eq: ["$shipped", "false"] }, then: false },
            { case: { $eq: ["$shipped", ""] }, then: false },
          ],
          default: { $toBool: "$shipped" },
        },
      },
    },
  };

  // Define stage to filter documents and pass only the unshipped orders
  const unshippedMatchStage = { $match: { convertedShippedFlag: false } };

  const result = aggregate(data, [shippedConversionStage, unshippedMatchStage]);

  t.deepEqual(
    result,
    [
      { _id: 2, item: "pie", qty: 10, shipped: 0, convertedShippedFlag: false },
      { _id: 5, item: "pecans", shipped: "false", convertedShippedFlag: false },
      { _id: 6, item: "nougat", shipped: "", convertedShippedFlag: false },
    ],
    "can apply $toBool"
  );

  t.end();
});

test("Type Conversion: $toLong", (t) => {
  const data = [
    { _id: 1, item: "apple", qty: 5 },
    { _id: 2, item: "pie", qty: "100" },
    { _id: 3, item: "ice cream", qty: 500 },
    { _id: 4, item: "almonds", qty: "50" },
  ];

  const result = aggregate(data, [
    { $addFields: { convertedQty: { $toLong: "$qty" } } },
  ]);

  t.deepEqual(
    result,
    [
      { _id: 1, item: "apple", qty: 5, convertedQty: 5 },
      { _id: 2, item: "pie", qty: "100", convertedQty: 100 },
      { _id: 3, item: "ice cream", qty: 500, convertedQty: 500 },
      { _id: 4, item: "almonds", qty: "50", convertedQty: 50 },
    ],
    "can apply $toLong"
  );

  t.end();
});

test("Type Conversion Operators", (t) => {
  let result = aggregate(
    [
      { _id: 1, item: "apple", qty: 5, zipcode: 12345 },
      { _id: 2, item: "pie", qty: 10, zipcode: 11111 },
      { _id: 3, item: "ice cream", zipcode: "12345" },
      { _id: 4, item: "almonds", qty: 2, zipcode: "12345-0030" },
    ],
    [
      { $addFields: { convertedZipCode: { $toString: "$zipcode" } } },
      // Define stage to sort documents by the converted zipcode
      { $sort: { convertedZipCode: 1 } },
    ]
  );

  t.deepEqual(
    [
      {
        _id: 2,
        item: "pie",
        qty: 10,
        zipcode: 11111,
        convertedZipCode: "11111",
      },
      {
        _id: 1,
        item: "apple",
        qty: 5,
        zipcode: 12345,
        convertedZipCode: "12345",
      },
      {
        _id: 3,
        item: "ice cream",
        zipcode: "12345",
        convertedZipCode: "12345",
      },
      {
        _id: 4,
        item: "almonds",
        qty: 2,
        zipcode: "12345-0030",
        convertedZipCode: "12345-0030",
      },
    ],
    result,
    "can apply $toString operator"
  );

  // Testing $toInt, $toLong, $toDouble, $toDecimal

  result = aggregate(
    [
      { _id: 1, item: "apple", qty: 5, price: 10 },
      { _id: 2, item: "pie", qty: 10, price: 20.0 },
      { _id: 3, item: "ice cream", qty: 2, price: "4.99" },
      { _id: 4, item: "almonds", qty: 5, price: 5 },
    ],
    [
      // Define stage to add convertedPrice and convertedQty fields with the converted price and qty values
      {
        $addFields: {
          convertedPrice: { $toDecimal: "$price" },
          convertedQty: { $toInt: "$qty" },
        },
      },
      // Define stage to calculate total price by multiplying convertedPrice and convertedQty fields
      {
        $project: {
          item: 1,
          totalPrice: { $multiply: ["$convertedPrice", "$convertedQty"] },
        },
      },
    ]
  );

  t.deepEqual(
    [
      { _id: 1, item: "apple", totalPrice: 50.0 },
      { _id: 2, item: "pie", totalPrice: 200.0 },
      { _id: 3, item: "ice cream", totalPrice: 9.98 },
      { _id: 4, item: "almonds", totalPrice: 25.0 },
    ],
    result,
    "can apply $toInt/$toLong and $toDouble/$toDecimal"
  );

  result = aggregate(
    [
      { _id: 1, item: "apple", qty: 5, order_date: new Date("2018-03-10") },
      { _id: 2, item: "pie", qty: 10, order_date: new Date("2018-03-12") },
      {
        _id: 3,
        item: "ice cream",
        qty: 2,
        price: "4.99",
        order_date: "2018-03-05",
      },
      { _id: 4, item: "almonds", qty: 5, price: 5, order_date: "2018-03-05" },
    ],
    [
      // Define stage to add convertedDate field with the converted order_date value
      { $addFields: { convertedDate: { $toDate: "$order_date" } } },
      // Define stage to sort documents by the converted date
      { $sort: { convertedDate: 1 } },
    ]
  );

  t.deepEqual(
    result,
    [
      {
        _id: 3,
        item: "ice cream",
        qty: 2,
        price: "4.99",
        order_date: "2018-03-05",
        convertedDate: new Date("2018-03-05T00:00:00Z"),
      },
      {
        _id: 4,
        item: "almonds",
        qty: 5,
        price: 5,
        order_date: "2018-03-05",
        convertedDate: new Date("2018-03-05T00:00:00Z"),
      },
      {
        _id: 1,
        item: "apple",
        qty: 5,
        order_date: new Date("2018-03-10T00:00:00Z"),
        convertedDate: new Date("2018-03-10T00:00:00Z"),
      },
      {
        _id: 2,
        item: "pie",
        qty: 10,
        order_date: new Date("2018-03-12T00:00:00Z"),
        convertedDate: new Date("2018-03-12T00:00:00Z"),
      },
    ],
    "can apply $toDate"
  );

  // Test $convert operator

  result = aggregate(
    [
      { _id: 1, item: "apple", qty: 5, price: 10 },
      { _id: 2, item: "pie", qty: 10, price: Number("20.0") },
      { _id: 3, item: "ice cream", qty: 2, price: "4.99" },
      { _id: 4, item: "almonds" },
      { _id: 5, item: "bananas", qty: 5000000000, price: Number("1.25") },
    ],
    [
      // Define stage to add convertedPrice and convertedQty fields with the converted price and qty values
      // If price or qty values are missing, the conversion returns a value of decimal value or int value of 0.
      // If price or qty values cannot be converted, the conversion returns a string
      {
        $addFields: {
          convertedPrice: {
            $convert: {
              input: "$price",
              to: "decimal",
              onError: "Error",
              onNull: Number("0"),
            },
          },
          convertedQty: {
            $convert: {
              input: "$qty",
              to: "int",
              onError: {
                $concat: [
                  "Could not convert ",
                  { $toString: "$qty" },
                  " to type integer.",
                ],
              },
              onNull: Number("0"),
            },
          },
        },
      },
      // calculate total price
      {
        $project: {
          totalPrice: {
            $switch: {
              branches: [
                {
                  case: { $eq: [{ $type: "$convertedPrice" }, "string"] },
                  then: "NaN",
                },
                {
                  case: { $eq: [{ $type: "$convertedQty" }, "string"] },
                  then: "NaN",
                },
              ],
              default: { $multiply: ["$convertedPrice", "$convertedQty"] },
            },
          },
        },
      },
    ]
  );

  t.deepEqual(
    result,
    [
      { _id: 1, totalPrice: Number("50.0000000000000") },
      { _id: 2, totalPrice: Number("200.0") },
      { _id: 3, totalPrice: Number("9.98") },
      { _id: 4, totalPrice: Number("0") },
      { _id: 5, totalPrice: "NaN" },
    ],
    "can apply $convert"
  );

  t.end();
});
