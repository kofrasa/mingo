import { AnyVal, RawArray, RawObject } from "../src/types";
import {
  cloneDeep,
  compare,
  groupBy,
  has,
  hashCode,
  intersection,
  isEmpty,
  isEqual,
  isObject,
  isObjectLike,
  merge,
  normalize,
  resolve,
  resolveGraph,
  sortBy,
  stringify,
  truthy,
  unique,
  walk
} from "../src/util";
import { ObjectId } from "./support";

describe("util", () => {
  describe("compare", () => {
    it("can compare less than, greater than, and equal to", () => {
      expect(compare(1, 5)).toBe(-1);
      expect(compare(5, 1)).toBe(1);
      expect(compare(1, 1)).toBe(0);
    });
  });

  describe("normalize", () => {
    it.each([
      [1, { $eq: 1 }],
      ["a", { $eq: "a" }],
      [true, { $eq: true }],
      [{ a: 1 }, { $eq: { a: 1 } }],
      [/mo/, { $regex: /mo/ }],
      [{ $regex: "ab" }, { $regex: /ab/ }],
      [{ $regex: "ab", $options: "i" }, { $regex: /ab/i }],
      [
        { $regex: "ab", $ne: "ab" },
        { $regex: /ab/, $ne: "ab" }
      ],
      [
        { $eq: 10, $gt: 5, $le: 2 },
        { $eq: 10, $gt: 5, $le: 2 }
      ]
    ])("should normalize: %p => %p", (input, output) => {
      expect(normalize(input)).toEqual(output);
    });
  });

  describe("isEqual", () => {
    it.each([
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
        true
      ],
      [() => void {}, () => void {}, false],
      [RegExp, RegExp, true],
      [new ObjectId("100"), new ObjectId("100"), false]
    ])("should check: %p == %p", (a, b, c) => {
      expect(isEqual(a, b)).toEqual(c);
    });

    it("should check for cycles in object", () => {
      const a: RawArray = [1, 2, 3];
      const b: RawArray = [1, 2, 3];
      const obj = { a, b };
      a.push(obj);
      b.push(obj);
      expect(isEqual(a, b)).toEqual(true);
      // expect(() => isEqual(a, b)).toThrow(/cycle detected/);
    });
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

    it("should accept rvalue for mismatched inputs", () => {
      const target = { a: 1 };
      expect(() => merge(target, [])).toThrowError();
    });

    it("flattens objects in target array", () => {
      const target = [{ a: 1 }, { a: 2 }];
      const result = merge(target, [{ b: 3 }, { b: 4 }, { c: 5 }], {
        flatten: true
      });
      expect(result).toBe(target);
      expect(result).toStrictEqual([{ a: 1, b: 3 }, { a: 2, b: 4 }, { c: 5 }]);
    });
  });

  describe("stringify", () => {
    const a: RawArray = [1, 2, 3];
    const b: RawArray = [4, 5, 6];

    it.each([
      [null, "null"],
      [undefined, "undefined"],
      [1, "1"],
      ["a", '"a"'],
      [true, "true"],
      [{ a: 1 }, "{a:1}"],
      [/mo/, "/mo/"],
      [[1, "a"], '[1,"a"]'],
      [new Date("2001-01-01T00:00:00.000Z"), "2001-01-01T00:00:00.000Z"],
      [(id: AnyVal) => id, "(id) => id"],
      [new Uint8Array([5, 2]), "Uint8Array[5,2]"],
      [new Float32Array([1.5, 2.5]), "Float32Array[1.5,2.5]"],
      [{ a: a, b: a }, "{a:[1,2,3],b:[1,2,3]}"],
      [[a, a], "[[1,2,3],[1,2,3]]"],
      [[a, b], "[[1,2,3],[4,5,6]]"],
      [[a, b, a, b], "[[1,2,3],[4,5,6],[1,2,3],[4,5,6]]"],
      [new ObjectId("1234567890"), 'ObjectId("1234567890")']
    ])("should pass: %p => %p", (input, output) => {
      expect(stringify(input)).toEqual(output);
    });

    it("should check for cycles in object", () => {
      const a: RawArray = [1, 2, 3];
      const b: RawArray = [4, 5, 6];
      const obj = { a, b };
      b.push(obj);

      expect(() => stringify(obj)).toThrow(/cycle detected/);
    });

    it("should check for cycles in array", () => {
      const a: RawArray = [1, 2, 3];
      const b: RawArray = [4, 5, 6, a];
      const c = [a, b];
      a.push(c);

      expect(() => stringify(c)).toThrow(/cycle detected/);
    });
  });

  describe("sortBy", () => {
    it("can sortBy hash key", () => {
      expect(
        sortBy(["cat", "ant", "function", "ant", "constructor"], k => k)
      ).toEqual(["ant", "ant", "cat", "constructor", "function"]);
    });
  });

  describe("groupBy", () => {
    it("should group by user-defined object", () => {
      const a = new ObjectId("100");
      const b = new ObjectId("200");
      const collection = [
        { userId: a, ix: 1 },
        { userId: a, ix: 2 },
        { userId: b, ix: 3 },
        { userId: b, ix: 4 },
        { userId: b, ix: 5 }
      ];

      const partitions = groupBy(collection, o => (o as RawObject).userId);

      expect(partitions.size).toEqual(2);
      expect(partitions.get(a)?.length).toEqual(2);
      expect(partitions.get(a)).toContainEqual({ userId: a, ix: 1 });
      expect(partitions.get(a)).not.toContainEqual({ userId: b, ix: 3 });
      expect(partitions.get(b)?.length).toEqual(3);
      expect(partitions.get(b)).toContainEqual({ userId: b, ix: 3 });
      expect(partitions.get(b)).not.toContainEqual({ userId: a, ix: 1 });
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
      [new Foo(), false, "custom object instance"]
    ];

    fixtures.forEach(arr => {
      it(arr[2] as string, () => {
        expect(isObject(arr[0])).toEqual(arr[1]);
      });
    });
  });

  describe("isEmpty", () => {
    const sample = ["0", 0, null, {}, "", []];
    expect(sample.map(isEmpty)).toEqual([false, false, true, true, true, true]);
  });

  describe("cloneDeep", () => {
    const a: RawArray = [1, 2, 3];
    const b: RawArray = [4, 5, 6];

    it.each([
      [null],
      [undefined],
      [1],
      ["a"],
      [true],
      [{ a: 1 }],
      [/mo/],
      [[1, "a"]],
      [new Date("2001-01-01T00:00:00.000Z")],
      [new Uint8Array([5, 2])],
      [new Float32Array([1.5, 2.5])],
      [{ a: a, b: a }],
      [[a, b, a, b]]
    ])("should pass: %p => %p", input => {
      const other = cloneDeep(input);
      expect(isEqual(input, other)).toEqual(true);
      if (isObjectLike(input)) expect(input !== other).toEqual(true);
    });
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
      const result = resolveGraph(doc, "b.e.1", { preserveKeys: true })!;
      expect({ a: 1, b: { c: 2, d: ["hello"], e: [2] } }).toEqual(result);
      expect(doc).toEqual(sameDoc);

      const leaf = resolve(result, "b.d");
      expect(leaf).toEqual(["hello"]);
      expect(leaf === doc.b.d).toBeTruthy();
    });
  });

  describe("unique", () => {
    it("returns unique items even with hash collision", () => {
      const first = "KNE_OC42-midas";
      const second = "KNE_OCS3-midas";
      expect(hashCode(first)).toEqual(hashCode(second));

      const res = unique([first, second]);
      expect(res).toEqual([first, second]);
    });

    it("returns stable unique items from duplicates", () => {
      expect(unique([1, 2, 2, 1])).toEqual([1, 2]);
      expect(unique([5, [2], 3, [2], 1])).toEqual([5, [2], 3, 1]);
    });
  });

  describe("intersection", () => {
    it("should find no intersection", () => {
      const res = intersection([
        [1, 2, 3],
        [4, 5, 6],
        [5, 6, 7]
      ]);
      expect(res).toEqual([]);
    });

    it("should find one intersection", () => {
      const res = intersection([
        [1, 2, 3],
        [4, 5, 3]
      ]);
      expect(res).toEqual([3]);
    });

    it("should find intersection of more than two arrays", () => {
      const res = intersection([
        [1, 2, 3],
        [3, 6, 2],
        [4, 5, 3]
      ]);
      expect(res).toEqual([3]);
    });

    it("should find intersection of multiple arrays with duplicates", () => {
      const res = intersection([
        [1, 2, 3, 6],
        [4, 5, 3],
        [3, 5, 3, 1]
      ]);
      expect(res).toEqual([3]);
    });

    it("should find intersection of multiple arrays with complex objects", () => {
      const res = intersection([
        [1, [2], 3, 3],
        [4, 5, 3, [2]],
        [[2], 4, 5, 3, 1]
      ]);
      expect(res).toEqual([[2], 3]);
    });

    it("should find intersection of multiple arrays and maintain stability of sequence", () => {
      const res = intersection([
        [1, [2], 3, 3, 9, 10, 11],
        [4, 5, 3, [2]],
        [[2], 4, 5, 3, 1]
      ]);
      expect(res).toEqual([[2], 3]);
    });
  });

  describe("truthy", () => {
    // [value, strict, result]
    for (const [v, b, r] of Array.from<[unknown, boolean, boolean]>([
      ["", true, true],
      ["", false, false],
      ["s", true, true],
      ["s", false, true],
      [0, true, false],
      [0, false, false],
      [1, true, true],
      [1, false, true],
      [[], true, true],
      [[], false, true],
      [false, true, false],
      [false, false, false],
      [true, true, true],
      [true, false, true],
      [null, true, false],
      [null, false, false],
      [undefined, true, false],
      [undefined, false, false]
    ])) {
      it(`should return ${String(r)} for '${JSON.stringify(
        v
      )}' with strict=${String(b)}.`, () => {
        expect(truthy(v, b)).toEqual(r);
      });
    }
  });

  describe("walk", () => {
    let o: RawObject = {};
    beforeEach(() => {
      o = {
        a: { b: { c: [{ x: 1 }, { x: 4 }] } }
      };
    });
    it("should return undefined for missing path", () => {
      let counter = 0;
      walk(o, "a.c.e", () => counter++);
      expect(counter).toEqual(0);
    });

    it("should navigate selector and invoke callback", () => {
      let counter = 0;
      walk(o, "a.b.c.x", () => counter++);
      expect(counter).toEqual(0);

      walk(o, "a.b.c.x", () => counter++, { descendArray: true });
      // invoke for each item in array
      expect(counter).toEqual(2);

      walk(o, "a.b.c", () => counter++);
      expect(counter).toEqual(3);
    });

    it("should build path if options provided", () => {
      let counter = 0;
      walk(o, "a.b.d.e", () => counter++);
      expect(has(resolve(o, "a.b") as RawObject, "d")).toEqual(false);

      walk(o, "a.b.d.e", () => counter++, { buildGraph: true });
      expect(has(resolve(o, "a.b") as RawObject, "d")).toEqual(true);
    });
  });
});
