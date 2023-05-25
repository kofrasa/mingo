import "../../../src/init/system";

import { aggregate, find } from "../../../src";
import { RawArray, RawObject } from "../../../src/types";
import { isEqual } from "../../../src/util";

describe("operators/expression/misc", () => {
  describe("$rand", () => {
    const data = [
      { name: "Archibald", voterId: 4321, district: 3, registered: true },
      { name: "Beckham", voterId: 4331, district: 3, registered: true },
      { name: "Carolin", voterId: 5321, district: 4, registered: true },
      { name: "Debarge", voterId: 4343, district: 3, registered: false },
      { name: "Eckhard", voterId: 4161, district: 3, registered: false },
      { name: "Faberge", voterId: 4300, district: 1, registered: true },
      { name: "Grimwald", voterId: 4111, district: 3, registered: true },
      { name: "Humphrey", voterId: 2021, district: 3, registered: true },
      { name: "Idelfon", voterId: 1021, district: 4, registered: true },
      { name: "Justo", voterId: 9891, district: 3, registered: false }
    ];
    const q = () =>
      find(
        data,
        { district: 3, $expr: { $lt: [0.5, { $rand: {} }] } },
        { _id: 0, name: 1, registered: 1 }
      ).all();

    it("returns random objects", () => {
      let b = true;
      const prev = q();
      // check 5 random objects. at least 1 pair should be false.
      for (let i = 0; i < 5; i++) {
        b = b && isEqual(prev, q());
      }
      expect(b).toEqual(false);
    });
  });

  describe("$getField", () => {
    it("Query Fields that Contain Periods", () => {
      const result = aggregate(
        [
          { _id: 1, item: "sweatshirt", "price.usd": 45.99, qty: 300 },
          { _id: 2, item: "winter coat", "price.usd": 499.99, qty: 200 },
          { _id: 3, item: "sun dress", "price.usd": 199.99, qty: 250 },
          { _id: 4, item: "leather boots", "price.usd": 249.99, qty: 300 },
          { _id: 5, item: "bow tie", "price.usd": 9.99, qty: 180 }
        ],
        [
          {
            $match: { $expr: { $gt: [{ $getField: "price.usd" }, 200] } }
          }
        ]
      );

      expect(result).toStrictEqual([
        { _id: 2, item: "winter coat", qty: 200, "price.usd": 499.99 },
        { _id: 4, item: "leather boots", qty: 300, "price.usd": 249.99 }
      ]);
    });

    it("Query Fields that Start with a Dollar Sign", () => {
      const result = aggregate(
        [
          { _id: 1, item: "sweatshirt", $price: 45.99, qty: 300 },
          { _id: 2, item: "winter coat", $price: 499.99, qty: 200 },
          { _id: 3, item: "sun dress", $price: 199.99, qty: 250 },
          { _id: 4, item: "leather boots", $price: 249.99, qty: 300 },
          { _id: 5, item: "bow tie", $price: 9.99, qty: 180 }
        ],
        [
          {
            $match: {
              $expr: { $gt: [{ $getField: { $literal: "$price" } }, 200] }
            }
          }
        ]
      );

      expect(result).toStrictEqual([
        { _id: 2, item: "winter coat", qty: 200, $price: 499.99 },
        { _id: 4, item: "leather boots", qty: 300, $price: 249.99 }
      ]);
    });

    it("Query a Field in a Sub-document", () => {
      const result = aggregate(
        [
          {
            _id: 1,
            item: "sweatshirt",
            "price.usd": 45.99,
            quantity: { $large: 50, $medium: 50, $small: 25 }
          },
          {
            _id: 2,
            item: "winter coat",
            "price.usd": 499.99,
            quantity: { $large: 35, $medium: 35, $small: 35 }
          },
          {
            _id: 3,
            item: "sun dress",
            "price.usd": 199.99,
            quantity: { $large: 45, $medium: 40, $small: 5 }
          },
          {
            _id: 4,
            item: "leather boots",
            "price.usd": 249.99,
            quantity: { $large: 20, $medium: 30, $small: 40 }
          },
          {
            _id: 5,
            item: "bow tie",
            "price.usd": 9.99,
            quantity: { $large: 0, $medium: 10, $small: 75 }
          }
        ],
        [
          {
            $match: {
              $expr: {
                $lte: [
                  {
                    $getField: {
                      field: { $literal: "$small" },
                      input: "$quantity"
                    }
                  },
                  20
                ]
              }
            }
          }
        ]
      );

      expect(result).toStrictEqual([
        {
          _id: 3,
          item: "sun dress",
          "price.usd": 199.99,
          quantity: { $large: 45, $medium: 40, $small: 5 }
        }
      ]);
    });
  });

  describe("$sampleRate", () => {
    it("can sample object", () => {
      const data: RawObject[] = [];
      for (let i = 0; i < 100; i++) {
        data.push({ _id: i });
      }

      const results: RawArray = [];
      for (let i = 0; i < 5; i++) {
        results.push(
          aggregate(data, [
            { $match: { $expr: { $sampleRate: 0.33 } } },
            { $count: "numMatches" }
          ])
        );
      }

      results.forEach(arr => {
        const r = (arr as RawObject[])[0];
        expect(r.numMatches).toBeGreaterThanOrEqual(15);
      });
    });
  });
});
