import "../../src/init/system";

import { find } from "../../src";
import { ProcessingMode } from "../../src/core";
import { RawArray, RawObject } from "../../src/types";
import { ObjectId, personData } from "../support";

const idStr = "123456789abe";
const obj = Object.assign({}, personData, { _id: new ObjectId(idStr) });

describe("operators/projection", () => {
  const data = [
    {
      _id: 1,
      zipcode: "63109",
      students: [
        { name: "john", school: 102, age: 10 },
        { name: "jess", school: 102, age: 11 },
        { name: "jeff", school: 108, age: 15 }
      ]
    },
    {
      _id: 2,
      zipcode: "63110",
      students: [
        { name: "ajax", school: 100, age: 7 },
        { name: "achilles", school: 100, age: 8 }
      ]
    },
    {
      _id: 3,
      zipcode: "63109",
      students: [
        { name: "ajax", school: 100, age: 7 },
        { name: "achilles", school: 100, age: 8 }
      ]
    },
    {
      _id: 4,
      zipcode: "63109",
      students: [
        { name: "barney", school: 102, age: 7 },
        { name: "ruth", school: 102, age: 16 }
      ]
    }
  ];

  describe("$elemMatch", () => {
    it("can project single field with $elemMatch", () => {
      const result = find(
        data,
        { zipcode: "63109" },
        { students: { $elemMatch: { school: 102 } } }
      ).all();
      expect(result).toEqual([
        { _id: 1, students: [{ name: "john", school: 102, age: 10 }] },
        { _id: 3 },
        { _id: 4, students: [{ name: "barney", school: 102, age: 7 }] }
      ]);
    });

    it("can project multiple nested documents with $elemMatch", () => {
      const result = find(
        data,
        { zipcode: "63109" },
        { students: { $elemMatch: { school: 102 } } },
        { useStrictMode: false }
      ).all();
      expect(result).toEqual([
        {
          _id: 1,
          students: [
            { name: "john", school: 102, age: 10 },
            { name: "jess", school: 102, age: 11 }
          ]
        },
        { _id: 3 },
        {
          _id: 4,
          students: [
            { name: "barney", school: 102, age: 7 },
            { name: "ruth", school: 102, age: 16 }
          ]
        }
      ]);
    });

    it("can project multiple fields with $elemMatch", () => {
      const result = find(
        data,
        { zipcode: "63109" },
        { students: { $elemMatch: { school: 102, age: { $gt: 10 } } } }
      ).all();
      expect(result).toEqual([
        { _id: 1, students: [{ name: "jess", school: 102, age: 11 }] },
        { _id: 3 },
        { _id: 4, students: [{ name: "ruth", school: 102, age: 16 }] }
      ]);
    });
  });

  describe("$slice", () => {
    it("can project $slice with limit", () => {
      const result = find(data, {}, { students: { $slice: 1 } }).all()[0] as {
        students: RawArray;
      };
      expect(result.students.length).toBe(1);
    });

    it("can project $slice with skip and limit", () => {
      const result = find(
        data,
        {},
        { students: { $slice: [1, 2] } }
      ).all()[0] as {
        students: RawArray;
      };
      expect(result.students.length).toBe(2);
    });

    it("can project nested selector with $slice", () => {
      const data: RawObject[] = [obj];
      const result = find(
        data,
        {},
        { "languages.programming": { $slice: [-3, 2] } }
      ).next() as typeof personData;

      expect(result["languages"]["programming"]).toEqual([
        "Javascript",
        "Bash"
      ]);
    });
  });

  describe("field selectors", () => {
    const options = { processingMode: ProcessingMode.CLONE_INPUT };

    it("should project only selected object graph from nested arrays", () => {
      // special tests
      // https://github.com/kofrasa/mingo/issues/25
      const data = [
        {
          key0: [
            {
              key1: [
                [[{ key2: [{ a: "value2" }, { a: "dummy" }, { b: 20 }] }]],
                { key2: "value" }
              ],
              key1a: { key2a: "value2a" }
            }
          ]
        }
      ];

      const expected = {
        key0: [{ key1: [[[{ key2: [{ a: "value2" }, { a: "dummy" }] }]]] }]
      };

      const result = find(
        data,
        { "key0.key1.key2": "value" },
        { "key0.key1.key2.a": 1 }
      ).next();

      expect(result).toEqual(expected);

      // should not modify original
      expect(data[0]).not.toEqual(result);
    });

    describe("projecting single key in object", () => {
      let data: RawObject[] = [];
      beforeEach(() => {
        data = [
          {
            name: "Steve",
            age: 15,
            features: { hair: "brown", eyes: "brown" }
          }
        ];
      });

      it("should omit single item in object", () => {
        const result = find(data, {}, { "features.hair": 1 }).next();
        expect(result).toEqual({ features: { hair: "brown" } });
        expect(data[0]).not.toEqual(result);
      });

      it("should throw exception: Projection cannot have a mix of inclusion and exclusion", () => {
        expect(() =>
          find(data, {}, { "features.hair": 0, name: 1 }).next()
        ).toThrow(Error);
      });

      it("should omit single item in object", () => {
        const result = find(data, {}, { "features.hair": 0 }, options).next();
        expect(result).toEqual({
          name: "Steve",
          age: 15,
          features: { eyes: "brown" }
        });

        //should not modify original
        expect(data[0]).not.toEqual(result);
      });
    });

    describe("project nested elements in array", () => {
      const data = [
        { name: "Steve", age: 15, features: ["hair", "eyes", "nose"] }
      ];

      it("should omit second element in array", () => {
        const result = find(data, {}, { "features.1": 0 }, options).next();
        expect(result).toEqual({
          name: "Steve",
          age: 15,
          features: ["hair", "nose"]
        });
        // should not modify original
        expect(data[0]).not.toEqual(result);
      });

      it("should select second element in array", () => {
        const result = find(data, {}, { "features.1": 1 }, options).next();
        expect(result).toEqual({ features: ["eyes"] });
        expect(data[0]).not.toEqual(result);
      });

      it("should select multiple keys from an object in array", () => {
        const result = find(
          [
            { id: 1, sub: [{ id: 11, name: "OneOne", test: true }] },
            { id: 2, sub: [{ id: 22, name: "TwoTwo", test: false }] }
          ],
          {},
          { "sub.id": 1, "sub.name": 1 }
        ).next();

        expect(result).toEqual({ sub: [{ id: 11, name: "OneOne" }] });
      });
    });
  });
});
