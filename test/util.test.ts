import { find } from "../src";
import { RawObject } from "../src/types";
import {
  cloneDeep,
  compare,
  isEmpty,
  isEqual,
  isObject,
  merge,
  resolve,
  resolveGraph,
  sortBy,
} from "../src/util";

describe("util", () => {
  describe("compare", () => {
    it("can compare less than, greater than, and equal to", () => {
      expect(compare(1, 5)).toBe(-1);
      expect(compare(5, 1)).toBe(1);
      expect(compare(1, 1)).toBe(0);
    });
  });

  describe("isEqual", () => {
    const fixture = [
      [NaN, 0 / 0, true],
      [NaN, NaN, true],
      [0, -0, true],
      [-0, 0, true],
      [1, NaN, false],
      [NaN, 1, false],
      [[1, 2], [1, 2], true],
      [[2, 1], [1, 2], false],
      [[1, "a", { a: /b/ }], [1, "a", { a: new RegExp("b") }], true],
      [null, undefined, false],
      [new Date(2003, 10, 1), new Date(2003, 10, 1), true],
      [
        { date: { year: 2013, month: 9, day: 25 } },
        { date: { year: 2013, month: 9, day: 25 } },
        true,
      ],
      [() => void {}, () => void {}, false],
      [RegExp, RegExp, true],
    ];
    const b = true;
    fixture.forEach((arr) => {
      it(`check: ${JSON.stringify(arr[0])} == ${JSON.stringify(
        arr[1]
      )}`, () => {
        expect(isEqual(arr[0], arr[1])).toEqual(arr[2]);
      });
    });
    expect(true).toBeTruthy();
  });

  describe("merge", () => {
    it("accepts same input and output arrays", () => {
      const target = [1, 2];
      const result = merge(target, [3, 4]);
      expect(result).toBe(target);
      expect(result).toStrictEqual([1, 2, 3, 4]);
    });

    it("accepts same input and output objects", () => {
      const target = { a: 1 };
      const result = merge(target, { b: 2 });
      expect(result).toBe(target);
      expect(result).toStrictEqual({ a: 1, b: 2 });
    });

    it("throws for mismatched input and output types", () => {
      const target = { a: 1 };
      expect(() => merge(target, [])).toThrowError();
    });

    it("flattens objects in target array", () => {
      const target = [{ a: 1 }, { a: 2 }];
      const result = merge(target, [{ b: 3 }, { b: 4 }, { c: 5 }], {
        flatten: true,
      });
      expect(result).toBe(target);
      expect(result).toStrictEqual([{ a: 1, b: 3 }, { a: 2, b: 4 }, { c: 5 }]);
    });
  });

  describe("sortBy", () => {
    it("can sortBy hash key", () => {
      expect(
        sortBy(["cat", "ant", "function", "ant", "constructor"], (k) => k)
      ).toEqual(["ant", "ant", "cat", "constructor", "function"]);
    });
  });

  describe("isObject", () => {
    class Foo {
      constructor(readonly a: string = "foo") {}
    }

    const OBJECT_PROTO = Object.getPrototypeOf({}) as RawObject;

    const arrayWithNullProto = ["a", "b"];
    Object.setPrototypeOf(arrayWithNullProto, null);

    const arrayWithObjectProto = ["a", "b"];
    Object.setPrototypeOf(arrayWithObjectProto, OBJECT_PROTO);

    const fooWithNullProto = new Foo();
    Object.setPrototypeOf(fooWithNullProto, null);

    const fooWithObjectProto = new Foo();
    Object.setPrototypeOf(fooWithObjectProto, OBJECT_PROTO);

    const fixtures = [
      [{}, true, "empty object literal"],
      [{ a: 1 }, true, "object literal with value"],
      [Object.create(null), true, "object from null proto"],
      [Object.create(OBJECT_PROTO), true, "object from object proto"],
      [fooWithNullProto, true, "custom type with null proto"],
      [fooWithObjectProto, true, "custom type with object proto"],
      [arrayWithObjectProto, false, "array with object proto"],
      [arrayWithNullProto, false, "array with null proto"],
      [Object.create({}), false, "object with object literal as proto"],
      [[3, 2, 1], false, "array instance"],
      [new Foo(), false, "custom object instance"],
    ];

    fixtures.forEach((arr) => {
      it(arr[2] as string, () => {
        expect(isObject(arr[0])).toEqual(arr[1]);
      });
    });
  });

  describe("isEmpty", () => {
    const sample = ["0", 0, null, {}, "", []];
    expect(sample.map(isEmpty)).toEqual([false, false, true, true, true, true]);
  });

  describe("resolveGraph", () => {
    const doc = { a: 1, b: { c: 2, d: ["hello"], e: [1, 2, 3] } };
    const sameDoc = cloneDeep(doc);

    it("resolves the path to the selected field only", () => {
      const result = resolveGraph(doc, "b.e.1");
      expect({ b: { e: [2] } }).toEqual(result);
      expect(doc).toEqual(sameDoc);
    });

    it("resolves item in nested array by index", () => {
      const result = resolveGraph({ a: [5, { b: [10] }] }, "a.1.b.0");
      expect({ a: [{ b: [10] }] }).toEqual(result);
    });

    it("resolves object in a nested array", () => {
      const result = resolveGraph({ a: [{ b: [{ c: 1 }] }] }, "a.b.c");
      expect({ a: [{ b: [{ c: 1 }] }] }).toEqual(result);
    });

    it("preserves other keys of the resolved object graph", () => {
      const result = resolveGraph(doc, "b.e.1", { preserveKeys: true });
      expect({ a: 1, b: { c: 2, d: ["hello"], e: [2] } }).toEqual(result);
      expect(doc).toEqual(sameDoc);

      const leaf = resolve(result, "b.d");
      expect(leaf).toEqual(["hello"]);
      expect(leaf === doc.b.d).toBeTruthy();
    });
  });

  describe("hash function collision", () => {
    it("should check collissions", () => {
      const data = [
        { codes: ["KNE_OC42-midas"] },
        { codes: ["KNE_OCS3-midas"] },
      ];
      const fixtures = [
        {
          query: { codes: { $in: ["KNE_OCS3-midas"] } },
          result: [
            { codes: ["KNE_OC42-midas"] },
            { codes: ["KNE_OCS3-midas"] },
          ],
          options: {},
          message:
            "should return both documents due to hash collision with default hash function",
        },
        {
          query: { codes: { $in: ["KNE_OCS3-midas"] } },
          result: [{ codes: ["KNE_OCS3-midas"] }],
          options: {
            hashFunction: (v) => JSON.stringify(v), // basic hash function, but has low performances
          },
          message:
            "should return the good document due to no hash collision with custom hash function",
        },
      ];
      for (let i = 0; i < fixtures.length; i++) {
        const line = fixtures[i];
        const res = find(data, line.query, {}, line.options).all();
        expect(res).toEqual(line.result);
      }
    });
  });
});
