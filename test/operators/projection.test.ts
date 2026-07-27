import { beforeEach, describe, expect, it } from "vitest";

import { find } from "../../src";
import { ProcessingMode } from "../../src/core/_internal";
import { Any, AnyObject } from "../../src/types";
import { ObjectId, personData, testPath } from "../support";

const idStr = "123456789abe";
const obj = Object.assign({}, personData, { _id: ObjectId(idStr) });

describe(testPath(import.meta.url), () => {
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
    it("returns undefined if value is not an array", () => {
      const result = find(
        [{ _id: 1, zipcode: "63109", students: "not an array" }],
        { zipcode: "63109" },
        { students: { $elemMatch: { school: 102 } } }
      ).all();
      expect(result).toEqual([{ _id: 1, students: undefined }]);
    });

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
    it("returns elements as is when not an array", () => {
      const result = find(
        [{ a: 20 }, { a: true }, { a: "hello" }],
        {},
        { a: { $slice: 1 } }
      ).all();
      expect(result).toEqual([{ a: 20 }, { a: true }, { a: "hello" }]);
    });

    it("can project $slice with limit", () => {
      const result = find(data, {}, { students: { $slice: 1 } }).all()[0] as {
        students: Any[];
      };
      expect(result.students.length).toBe(1);
    });

    it("can project $slice with skip and limit", () => {
      const result = find(
        data,
        {},
        { students: { $slice: [1, 2] } }
      ).all()[0] as {
        students: Any[];
      };
      expect(result.students.length).toBe(2);
    });

    it("can project nested selector with $slice", () => {
      const data: AnyObject[] = [obj];
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
      let data: AnyObject[] = [];
      beforeEach(() => {
        data = [
          {
            name: "Steve",
            age: 15,
            features: { hair: "brown", eyes: "brown" }
          }
        ];
      });

      it("should include single item in object", () => {
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

    describe("project consistently with nested OR dot expressions", () => {
      it.each([
        [
          [{ _id: 1 }, { _id: 2, test: { a: 3 } }],
          { test: { a: 1 } },
          { "test.a": 1 }
        ],

        [
          [
            { _id: 1, test: { a: [] } },
            { _id: 2, test: { a: [] } }
          ],
          { test: { a: [] } },
          { "test.a": [] }
        ],

        [
          [
            { _id: 1, test: { a: "yes" } },
            { _id: 2, test: { a: "yes" } }
          ],
          { test: { a: "yes" } },
          { "test.a": "yes" }
        ]
      ])(
        "should project with consistent behaviour for nested and dot expressions. %o",
        (output, projectA, projectB) => {
          const input = [{ _id: 1 }, { _id: 2, test: { a: 3, b: 5 } }];
          expect(find(input, {}, projectA).all()).toEqual(output);
          expect(find(input, {}, projectB).all()).toEqual(output);
        }
      );
    });
  });

  describe("positional '$' operator", () => {
    const students = [
      { _id: 1, semester: 1, grades: [70, 87, 90] },
      { _id: 2, semester: 1, grades: [90, 88, 92] },
      { _id: 3, semester: 1, grades: [85, 100, 90] },
      { _id: 4, semester: 2, grades: [79, 85, 80] },
      { _id: 5, semester: 2, grades: [88, 88, 92] },
      { _id: 6, semester: 2, grades: [95, 90, 96] }
    ];

    const grades = [
      {
        _id: 7,
        semester: 3,
        grades: [
          { grade: 80, mean: 75, std: 8 },
          { grade: 85, mean: 90, std: 5 },
          { grade: 90, mean: 85, std: 3 }
        ]
      },

      {
        _id: 8,
        semester: 3,
        grades: [
          { grade: 92, mean: 88, std: 8 },
          { grade: 78, mean: 90, std: 5 },
          { grade: 88, mean: 85, std: 3 }
        ]
      }
    ];

    it("project array values", () => {
      const result = find(
        students,
        { semester: 1, grades: { $gte: 85 } },
        { "grades.$": 1 }
      ).all();
      expect(result).toEqual([
        { _id: 1, grades: [87] },
        { _id: 2, grades: [90] },
        { _id: 3, grades: [85] }
      ]);
    });

    it("project array documents", () => {
      const result = find(
        grades,
        { "grades.mean": { $gt: 70 } },
        { "grades.$": 1 }
      ).all();
      expect(result).toEqual([
        { _id: 7, grades: [{ grade: 80, mean: 75, std: 8 }] },
        { _id: 8, grades: [{ grade: 92, mean: 88, std: 8 }] }
      ]);
    });

    it("project array of documents within compound operator", () => {
      const result = find(
        grades,
        {
          $and: [{ "grades.mean": { $gt: 70 } }, { semester: 3 }]
        },
        { "grades.$": 1 }
      ).all();
      expect(result).toEqual([
        { _id: 7, grades: [{ grade: 80, mean: 75, std: 8 }] },
        { _id: 8, grades: [{ grade: 92, mean: 88, std: 8 }] }
      ]);
    });

    it("fails when a condition in a compound query is false", () => {
      const result = find(
        grades,
        {
          $and: [{ "grades.mean": { $gt: 70 } }, { semester: 2 }]
        },
        { "grades.$": 1 }
      ).all();
      expect(result).toEqual([]);
    });

    it("project array of documents with multiple compound operators ($and, $or)", () => {
      const result = find(
        grades,
        {
          $and: [{ "grades.grade": { $gt: 80 } }],
          $or: [{ "grades.std": 5 }, { "grades.std": 3 }]
        },
        {
          "grades.$": 1
        }
      ).all();
      expect(result).toEqual([
        { _id: 7, grades: [{ grade: 85, mean: 90, std: 5 }] },
        { _id: 8, grades: [{ grade: 88, mean: 85, std: 3 }] }
      ]);
    });

    it("project array of documents with multiple compound operators ($and, $nor)", () => {
      const result = find(
        grades,
        {
          $and: [{ "grades.grade": { $gt: 80 } }],
          $nor: [{ "grades.std": 10 }, { "grades.std": 10 }]
        },
        {
          "grades.$": 1
        }
      ).all();
      expect(result).toEqual([
        { _id: 7, grades: [{ grade: 85, mean: 90, std: 5 }] },
        { _id: 8, grades: [{ grade: 92, mean: 88, std: 8 }] }
      ]);
    });

    it("project array documents from nested values", () => {
      const result = find(
        grades,
        { "grades.mean": { $gt: 80 } },
        { "grades.mean.$": 1 }
      ).all();
      expect(result).toEqual([
        { _id: 7, grades: [{ mean: 90 }] },
        { _id: 8, grades: [{ mean: 88 }] }
      ]);
    });

    it("project positional item on $elemMatch", () => {
      const result = find(
        grades,
        {
          grades: {
            $elemMatch: {
              mean: { $gt: 70 },
              grade: { $gt: 90 }
            }
          }
        },
        { "grades.$": 1 }
      ).all();

      expect(result).toEqual([
        {
          _id: 8,
          grades: [
            {
              grade: 92,
              mean: 88,
              std: 8
            }
          ]
        }
      ]);
    });
  });

  describe("path collision", () => {
    it("should error when projected paths collide", () => {
      const data = [
        { _id: 1, user: { name: "Alice", age: 30 } },
        { _id: 2, user: { name: "Bob", age: 25 } }
      ];
      expect(() => find(data, {}, { user: 1, "user.name": 1 }).all()).toThrow(
        /Path collision/
      );
    });
  });
});
