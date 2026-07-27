import * as samples from "../../support";

const orders = [
  { _id: 1, item: { name: "almonds" }, price: 12, quantity: 2 },
  { _id: 2, item: { name: "pecans" }, price: 20, quantity: 1 },
  { _id: 3 }
];

const inventory = [
  { _id: 1, sku: "almonds", description: "product 1", instock: 120 },
  { _id: 2, sku: "bread", description: "product 2", instock: 80 },
  { _id: 3, sku: "cashews", description: "product 3", instock: 60 },
  { _id: 4, sku: "pecans", description: "product 4", instock: 70 },
  { _id: 5, sku: null, description: "Incomplete" },
  { _id: 6 }
];

const members = [
  {
    _id: 1,
    name: ["giraffe22", "pandabear", "artie"],
    joined: new Date("2016-05-01"),
    status: "A"
  },
  {
    _id: 2,
    name: "giraffe",
    joined: new Date("2017-05-01"),
    status: "D"
  },
  {
    _id: 3,
    name: "giraffe1",
    joined: new Date("2017-10-01"),
    status: "A"
  },
  {
    _id: 4,
    name: "panda",
    joined: new Date("2018-10-11"),
    status: "A"
  },
  {
    _id: 5,
    name: "pandabear",
    joined: new Date("2018-12-01"),
    status: "A"
  },
  {
    _id: 6,
    name: "giraffe2",
    joined: new Date("2018-12-01"),
    status: "D"
  }
];

const warehouses = [
  { _id: 1, stock_item: "almonds", warehouse: "A", instock: 120 },
  { _id: 2, stock_item: "pecans", warehouse: "A", instock: 80 },
  { _id: 3, stock_item: "almonds", warehouse: "B", instock: 60 },
  { _id: 4, stock_item: "cookies", warehouse: "B", instock: 40 },
  { _id: 5, stock_item: "cookies", warehouse: "A", instock: 80 }
];

const holidays = [
  { _id: 1, year: 2018, name: "New Years", date: new Date("2018-01-01") },
  { _id: 2, year: 2018, name: "Pi Day", date: new Date("2018-03-14") },
  { _id: 3, year: 2018, name: "Ice Cream Day", date: new Date("2018-07-15") },
  { _id: 4, year: 2017, name: "New Years", date: new Date("2017-01-01") },
  { _id: 5, year: 2017, name: "Ice Cream Day", date: new Date("2017-07-16") }
];

const restaurants = [
  {
    _id: 1,
    name: "American Steak House",
    food: ["filet", "sirloin"],
    beverages: ["beer", "wine"]
  },
  {
    _id: 2,
    name: "Honest John Pizza",
    food: ["cheese pizza", "pepperoni pizza"],
    beverages: ["soda"]
  }
];

samples.runTestPipeline(samples.testPath(import.meta.url), [
  {
    message: "Perform a Single Equality Join",
    input: orders,
    pipeline: [
      {
        $lookup: {
          from: inventory,
          localField: "item.name",
          foreignField: "sku",
          as: "inventory_docs"
        }
      }
    ],
    expected: [
      {
        _id: 1,
        item: { name: "almonds" },
        price: 12,
        quantity: 2,
        inventory_docs: [
          { _id: 1, sku: "almonds", description: "product 1", instock: 120 }
        ]
      },
      {
        _id: 2,
        item: { name: "pecans" },
        price: 20,
        quantity: 1,
        inventory_docs: [
          { _id: 4, sku: "pecans", description: "product 4", instock: 70 }
        ]
      },
      {
        _id: 3,
        inventory_docs: [
          { _id: 5, sku: null, description: "Incomplete" },
          { _id: 6 }
        ]
      }
    ]
  },
  {
    message: "Use $lookup with an Array",
    input: [
      {
        _id: 1,
        title: "Reading is ...",
        enrollmentlist: ["giraffe2", "pandabear", "artie"],
        days: ["M", "W", "F"]
      },
      {
        _id: 2,
        title: "But Writing ...",
        enrollmentlist: ["giraffe1", "artie"],
        days: ["T", "F"]
      }
    ],
    pipeline: [
      {
        $lookup: {
          from: members,
          localField: "enrollmentlist",
          foreignField: "name",
          as: "enrollee_info"
        }
      },
      {
        // ensuring test stability
        $addFields: {
          enrollee_info: {
            $sortArray: {
              input: "$enrollee_info",
              sortBy: { _id: 1 }
            }
          }
        }
      }
    ],
    expected: [
      {
        _id: 1,
        title: "Reading is ...",
        enrollmentlist: ["giraffe2", "pandabear", "artie"],
        days: ["M", "W", "F"],
        enrollee_info: [
          {
            _id: 1,
            name: ["giraffe22", "pandabear", "artie"],
            joined: new Date("2016-05-01T00:00:00Z"),
            status: "A"
          },
          {
            _id: 5,
            name: "pandabear",
            joined: new Date("2018-12-01T00:00:00Z"),
            status: "A"
          },
          {
            _id: 6,
            name: "giraffe2",
            joined: new Date("2018-12-01T00:00:00Z"),
            status: "D"
          }
        ]
      },
      {
        _id: 2,
        title: "But Writing ...",
        enrollmentlist: ["giraffe1", "artie"],
        days: ["T", "F"],
        enrollee_info: [
          {
            _id: 1,
            name: ["giraffe22", "pandabear", "artie"],
            joined: new Date("2016-05-01T00:00:00Z"),
            status: "A"
          },
          {
            _id: 3,
            name: "giraffe1",
            joined: new Date("2017-10-01T00:00:00Z"),
            status: "A"
          }
        ]
      }
    ]
  },
  {
    message: "Use Multiple Join Conditions and a Correlated Subquery",
    input: [
      { _id: 1, item: "almonds", price: 12, ordered: 2 },
      { _id: 2, item: "pecans", price: 20, ordered: 1 },
      { _id: 3, item: "cookies", price: 10, ordered: 60 }
    ],
    pipeline: [
      {
        $lookup: {
          from: warehouses,
          let: { order_item: "$item", order_qty: "$ordered" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$stock_item", "$$order_item"] },
                    { $gte: ["$instock", "$$order_qty"] }
                  ]
                }
              }
            },
            { $project: { stock_item: 0, _id: 0 } }
          ],
          as: "stockdata"
        }
      }
    ],
    expected: [
      {
        _id: 1,
        item: "almonds",
        price: 12,
        ordered: 2,
        stockdata: [
          { warehouse: "A", instock: 120 },
          { warehouse: "B", instock: 60 }
        ]
      },
      {
        _id: 2,
        item: "pecans",
        price: 20,
        ordered: 1,
        stockdata: [{ warehouse: "A", instock: 80 }]
      },
      {
        _id: 3,
        item: "cookies",
        price: 10,
        ordered: 60,
        stockdata: [{ warehouse: "A", instock: 80 }]
      }
    ]
  },
  {
    message: "Perform an Uncorrelated Subquery with $lookup",
    input: [
      {
        _id: 1,
        student: "Ann Aardvark",
        sickdays: [new Date("2018-05-01"), new Date("2018-08-23")]
      },
      {
        _id: 2,
        student: "Zoe Zebra",
        sickdays: [new Date("2018-02-01"), new Date("2018-05-23")]
      }
    ],
    pipeline: [
      {
        $lookup: {
          from: holidays,
          pipeline: [
            { $match: { year: 2018 } },
            { $project: { _id: 0, date: { name: "$name", date: "$date" } } },
            { $replaceRoot: { newRoot: "$date" } }
          ],
          as: "holidays"
        }
      }
    ],
    expected: [
      {
        _id: 1,
        student: "Ann Aardvark",
        sickdays: [
          new Date("2018-05-01T00:00:00.000Z"),
          new Date("2018-08-23T00:00:00.000Z")
        ],
        holidays: [
          { name: "New Years", date: new Date("2018-01-01T00:00:00.000Z") },
          { name: "Pi Day", date: new Date("2018-03-14T00:00:00.000Z") },
          { name: "Ice Cream Day", date: new Date("2018-07-15T00:00:00.000Z") }
        ]
      },
      {
        _id: 2,
        student: "Zoe Zebra",
        sickdays: [
          new Date("2018-02-01T00:00:00.000Z"),
          new Date("2018-05-23T00:00:00.000Z")
        ],
        holidays: [
          { name: "New Years", date: new Date("2018-01-01T00:00:00.000Z") },
          { name: "Pi Day", date: new Date("2018-03-14T00:00:00.000Z") },
          { name: "Ice Cream Day", date: new Date("2018-07-15T00:00:00.000Z") }
        ]
      }
    ]
  },
  {
    message: "Perform a Concise Correlated Subquery with $lookup",
    input: [
      {
        _id: 1,
        item: "filet",
        restaurant_name: "American Steak House"
      },
      {
        _id: 2,
        item: "cheese pizza",
        restaurant_name: "Honest John Pizza",
        drink: "lemonade"
      },
      {
        _id: 3,
        item: "cheese pizza",
        restaurant_name: "Honest John Pizza",
        drink: "soda"
      }
    ],
    pipeline: [
      {
        $lookup: {
          from: restaurants,
          localField: "restaurant_name",
          foreignField: "name",
          let: { orders_drink: "$drink" },
          pipeline: [
            {
              $match: {
                $expr: { $in: ["$$orders_drink", "$beverages"] }
              }
            }
          ],
          as: "matches"
        }
      }
    ],
    expected: [
      {
        _id: 1,
        item: "filet",
        restaurant_name: "American Steak House",
        matches: []
      },
      {
        _id: 2,
        item: "cheese pizza",
        restaurant_name: "Honest John Pizza",
        drink: "lemonade",
        matches: []
      },
      {
        _id: 3,
        item: "cheese pizza",
        restaurant_name: "Honest John Pizza",
        drink: "soda",
        matches: [
          {
            _id: 2,
            name: "Honest John Pizza",
            food: ["cheese pizza", "pepperoni pizza"],
            beverages: ["soda"]
          }
        ]
      }
    ]
  }
]);
