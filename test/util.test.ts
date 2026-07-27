import { beforeEach, describe, expect, it } from "vitest";

import { Any, AnyObject } from "../src/types";
import {
  cloneDeep,
  compare,
  groupBy,
  has,
  hashCode,
  HashMap,
  intersection,
  isEmpty,
  isEqual,
  isObject,
  isObjectLike,
  MISSING,
  normalize,
  OBJECT_PROTO_PROPS,
  PathValidator,
  removeValue,
  resolve,
  resolveGraph,
  truthy,
  typeOf,
  unique,
  walk
} from "../src/util/_internal";
import { makeRandomString, ObjectId } from "./support";

class Custom {
  constructor(readonly _id: string) {}
}

class CustomWithToString extends Custom {
  toString() {
    return "Custom:" + this._id;
  }
}

describe("util", () => {
  describe("PathValidator", () => {
    it("should detect conflicts for overlapping paths: nested -> root", () => {
      const trie = new PathValidator();
      expect(trie.add("name.firstname")).toBe(true);
      expect(trie.add("name.lastname")).toBe(true);
      expect(trie.add("name")).toBe(false);
      expect(trie.add("age")).toBe(true);
    });

    it("should detect conflicts for overlapping paths: root -> nested", () => {
      const trie = new PathValidator();
      expect(trie.add("name")).toBe(true);
      expect(trie.add("name.firstname")).toBe(false);
      expect(trie.add("address")).toBe(true);
      expect(trie.add("address.street.name")).toBe(false);
    });

    it("should not detect conflict for non-overlapping paths", () => {
      const trie = new PathValidator();
      expect(trie.add("name.firstname")).toBe(true);
      expect(trie.add("name.lastname")).toBe(true);
      expect(trie.add("address.street")).toBe(true);
      expect(trie.add("address.city")).toBe(true);
    });
  });

  describe("compare", () => {
    const items: Any[] = [
      undefined,
      [],
      null,
      1,
      "a",
      Symbol(),
      // array are compared element-wise
      [Symbol("sym")],
      { a: 1, b: 2 },
      new Uint8Array(0),
      false,
      true,
      new Date(),
      /a/,
      () => void 0,
      // compare custom types with toString
      new CustomWithToString("abc"),
      new CustomWithToString("efg")
    ] as const;

    for (let i = 1; i < items.length; i++) {
      const prev = items[i - 1];
      const next = items[i];
      it(`should compare by sort order (${typeOf(prev)} < ${typeOf(next)})`, () => {
        expect(compare(prev, prev)).toBe(0);
        expect(compare(prev, next)).toBe(-1);
        expect(compare(next, prev)).toBe(1);
      });
    }

    it("should compare objects by keys then values", () => {
      // keys
      expect(compare({ a: 1, b: 2 }, { a: 1, c: 1 })).toEqual(-1);
      expect(compare({ a: 1, c: 1 }, { a: 1, b: 2 })).toEqual(1);
      // values
      expect(compare({ a: 1, c: 2 }, { a: 1, c: 5 })).toEqual(-1);
      expect(compare({ a: 1, c: 5 }, { a: 1, c: 2 })).toEqual(1);
    });

    it("should compare special internal type MISSING as undefined", () => {
      expect(compare(MISSING, undefined)).toEqual(0);
      expect(compare(undefined, MISSING)).toEqual(0);
      expect(compare(MISSING, MISSING)).toEqual(0);
    });

    it("should compare data memebers of custom types without toString()", () => {
      const [a, b] = ["0", "1"].map(n => new Custom(n));
      expect(compare(a, a)).toBe(0);
      expect(compare(a, b)).toEqual(-1);
      expect(compare(b, a)).toEqual(1);
    });

    it("should compare booleans correctly", () => {
      expect(compare(false, false)).toBe(0);
      expect(compare(false, true)).toBe(-1);
      expect(compare(true, false)).toBe(1);
      expect(compare(true, true)).toBe(0);
    });

    it("should compare toString() of custom types if provided", () => {
      const [a, b] = ["0", "1"].map(n => new CustomWithToString(n));
      expect(compare(a, a)).toBe(0);
      expect(compare(a, b)).toEqual(-1);
      expect(compare(b, a)).toEqual(1);
    });

    it("should compare different custom types by constructor name for consistent ordering", () => {
      Array.from<[Any, Any, number]>([
        // native type still first in sort order
        [new CustomWithToString("0"), new RegExp(/as/), 1],
        [new CustomWithToString("0"), new Date(), 1],
        // custom types use constructor names
        [new CustomWithToString("0"), new Custom("0"), 1],
        [new CustomWithToString("0"), new Error(), -1]
      ]).forEach(([a, b, r]) => {
        expect(compare(a, b)).toEqual(r);
        expect(compare(b, a)).toEqual(-r);
      });
    });

    it("should treat different typed arrays with same byte representation as equal", () => {
      const u8 = new Uint8Array([255, 0, 0, 1]);
      const i8 = new Int8Array([255, 0, 0, 1]);
      expect(compare(u8, i8)).toBe(0);
    });

    it("should compare typed arrays by byte order", () => {
      const u8 = new Uint8Array([255, 1, 0, 1]);
      const i8 = new Int8Array([255, 0, 0, 1]);
      expect(compare(u8, i8)).toBe(1);
    });

    it("should compare different refs with same values correctly", () => {
      const now = Date.now();
      expect(compare(/abc/, /abc/)).toBe(0);
      expect(compare([1], [1])).toBe(0);
      expect(compare({ a: 1 }, { a: 1 })).toBe(0);
      expect(compare(new Date(now), new Date(now))).toBe(0);
      // custom types with toString
      expect(
        compare(new CustomWithToString("x"), new CustomWithToString("x"))
      ).toBe(0);
      expect(compare(new Error("fail"), new Error("fail"))).toBe(0);
      // custom types without toString
      expect(compare(new Custom("x"), new Custom("x"))).toBe(0);
    });

    it("should compare regex in correct order", () => {
      const input = [/abc/, /abc/m, /abc/i, /abd/, /zzz/, /ab/];
      expect(input.sort(compare)).toEqual([
        /ab/,
        /abc/,
        /abc/i,
        /abc/m,
        /abd/,
        /zzz/
      ]);
    });

    describe("array comparison", () => {
      it("should compare arrays by smallest element within", () => {
        const array = [
          [1, 2],
          [1, 2, 0],
          [1],
          [[1, 2]],
          [1, 3],
          [1, "a"],
          [],
          [2],
          [[1]],
          ["a"],
          [1, null],
          null
        ].sort(compare);
        expect(array).toEqual([
          [],
          [1, null],
          null, // same order as [1, null] but stable sort keeps original order
          [1, 2, 0],
          [1],
          [1, 2],
          [1, 3],
          [1, "a"],
          [2],
          ["a"],
          [[1]],
          [[1, 2]]
        ]);
      });

      it("should compare array element-wise against other values", () => {
        expect(compare([1], 5)).toEqual(-1);
        expect(compare([5], 5)).toEqual(0);
        expect(compare([10], 5)).toEqual(1);
        // nested array
        expect(compare([[]], 5)).toEqual(1);
        expect(compare([[1]], 5)).toEqual(1);
        expect(compare([[10]], 5)).toEqual(1);

        expect(compare([[]], true)).toEqual(-1);
        expect(compare([[false]], true)).toEqual(-1);
      });
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
    ])("should normalize: %o => %o", (input, output) => {
      expect(normalize(input)).toEqual(output);
    });
  });

  describe("removeValue", () => {
    for (const [path, res, opts] of [
      // primitive and null targets
      ["a.k", { a: [{ b: [{ c: 0 }, { c: 1 }, { c: 2 }] }] }],
      [
        "a.b.c.0",
        { a: [{ b: [{ c: 0 }, { c: 1 }, { c: 2 }] }] },
        { descendArray: true }
      ],

      // object targets
      ["a", {}],
      ["b", { a: [{ b: [{ c: 0 }, { c: 1 }, { c: 2 }] }] }],
      ["a.b.1", { a: [{ b: [{ c: 0 }, { c: 1 }, { c: 2 }] }] }],
      ["a.0.b.1", { a: [{ b: [{ c: 0 }, { c: 2 }] }] }],
      ["a.b.1", { a: [{ b: [{ c: 0 }, { c: 2 }] }] }, { descendArray: true }],
      ["a.b.1.c", { a: [{ b: [{ c: 0 }, { c: 1 }, { c: 2 }] }] }],
      ["a.0.b.1.c", { a: [{ b: [{ c: 0 }, {}, { c: 2 }] }] }],
      [
        "a.b.1.c",
        { a: [{ b: [{ c: 0 }, {}, { c: 2 }] }] },
        { descendArray: true }
      ],
      ["a.0.b.c", { a: [{ b: [{ c: 0 }, { c: 1 }, { c: 2 }] }] }],
      ["a.b.c", { a: [{ b: [{}, {}, {}] }] }, { descendArray: true }]
    ] as const) {
      const obj = { a: [{ b: [{ c: 0 }, { c: 1 }, { c: 2 }] }] };
      it(`should remove ${path} from ${JSON.stringify(obj)} => ${JSON.stringify(res)}, with ${JSON.stringify(opts ?? {})}`, () => {
        removeValue(obj, path, opts);
        expect(obj).toEqual(res);
      });
    }
  });

  describe("typeOf", () => {
    it.each([
      ["null", null],
      ["undefined", undefined],
      ["number", NaN],
      ["number", 1],
      ["string", ""],
      ["regexp", /a/],
      ["boolean", true],
      ["boolean", false],
      ["symbol", Symbol("a")],
      ["error", new Error()],
      ["array", []],
      ["object", {}],
      ["arraybuffer", new ArrayBuffer(0)],
      ["custom", new Custom("abc")]
    ])("should expect %o for %o", (res, input) => {
      expect(typeOf(input)).toEqual(res);
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
      [{ a: 1, b: 1 }, { a: 1, b: 1, c: undefined }, false], // different key lengths
      [() => void {}, () => void {}, false],
      [RegExp, RegExp, true],
      [ObjectId("100"), ObjectId("100"), true],
      [new Custom("123"), new Custom("123"), true],
      [new Custom("123"), new Custom("456"), false]
    ])("should check: %o == %o", (a, b, c) => {
      expect(isEqual(a, b)).toEqual(c);
    });

    it("should check for cycles in object", () => {
      const a: Any[] = [1, 2, 3];
      const b: Any[] = [1, 2, 3];
      const obj = { a, b };
      a.push(obj);
      b.push(obj);
      expect(isEqual(a, b)).toEqual(true);
      // expect(() => isEqual(a, b)).toThrow(/cycle detected/);
    });
  });

  describe("groupBy", () => {
    it("should group by user-defined object", () => {
      const a = ObjectId("100");
      const b = ObjectId("200");
      const collection = [
        { userId: a, ix: 1 },
        { userId: a, ix: 2 },
        { userId: b, ix: 3 },
        { userId: b, ix: 4 },
        { userId: b, ix: 5 }
      ];

      const partitions = groupBy(collection, o => (o as AnyObject).userId);

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

    const OBJECT_PROTO = Object.getPrototypeOf({}) as AnyObject;

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
      [Object.create({}), true, "object with new object literal as proto"],
      [fooWithNullProto, true, "custom class with null proto"],
      [fooWithObjectProto, true, "custom class with object proto"],
      [arrayWithObjectProto, false, "NOT array with object proto"],
      [arrayWithNullProto, false, "NOT array with null proto"],
      [[3, 2, 1], false, "NOT array instance"],
      [new Foo(), false, "NOT custom class instance"]
    ];

    fixtures.forEach(arr => {
      it(arr[2] as string, () => {
        expect(isObject(arr[0])).toEqual(arr[1]);
      });
    });
  });

  describe("isEmpty", () => {
    it("should detect empty values", () => {
      const sample = ["0", 0, null, {}, "", []];
      expect(sample.map(isEmpty)).toEqual([
        false,
        false,
        true,
        true,
        true,
        true
      ]);
    });
  });

  describe("cloneDeep", () => {
    const a: Any[] = [1, 2, 3];
    const b: Any[] = [4, 5, 6];

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
    ])("should clone: %o", input => {
      const other = cloneDeep(input);
      expect(isEqual(input, other)).toEqual(true);
      if (isObjectLike(input)) expect(input !== other).toEqual(true);
    });

    it("should throw error when cloning cyclic objects", () => {
      const obj: AnyObject = { a: 1 };
      obj.self = obj;
      expect(() => cloneDeep(obj)).toThrow(/cycle detected/);
    });
  });

  describe("resolve", () => {
    const doc = { a: 1, b: { c: 2, d: ["hello"], e: [1, 2, 3] } };
    const sameDoc = cloneDeep(doc);

    it("resolves the path to the selected field only", () => {
      const result = resolve(doc, "b.e.1");
      expect(result).toEqual(2);
      expect(doc).toEqual(sameDoc);
    });

    it("resolves item in nested array by index", () => {
      const result = resolve({ a: [5, { b: [10] }] }, "a.1.b.0");
      expect(result).toEqual(10);
    });

    it("resolves value in a nested array", () => {
      const result = resolve({ a: [{ b: [{ c: 1 }] }] }, "a.b.c");
      expect(result).toEqual([[1]]);
    });

    it("resolves value in a nested array with index", () => {
      const result = resolve({ a: [{ b: [{ c: 1 }] }] }, "a.0.b.c");
      expect(result).toEqual([1]);
    });

    it("resolves value from custom object", () => {
      const result = resolve(ObjectId("100") as Any as AnyObject, "_id");
      expect(result).toEqual("100");
    });

    it("throws when selector contains __proto__ anywhere in the path", () => {
      expect(() => resolve({ a: 1 }, "__proto__")).toThrow(/__proto__/);
      expect(() => resolve({ a: { b: 2 } }, "a.__proto__.b")).toThrow(
        /__proto__/
      );
      expect(() => resolve({ a: { b: 2 } }, "a.b.__proto__")).toThrow(
        /__proto__/
      );
    });

    it("does not resolve Object.prototype properties unless explicitly present", () => {
      for (const prop of OBJECT_PROTO_PROPS) {
        const selector = `a.${prop}`;
        expect(resolve({ a: 1 }, selector)).toBeUndefined();
        expect(resolve({ a: { [prop!]: "value" } }, selector)).toEqual("value");
      }
    });
  });

  describe("resolveGraph", () => {
    const optsKeys = { preserveKeys: true };
    const optsIndex = { preserveIndex: "default" as const };
    const optsMissing = { preserveIndex: "missing" as const };

    const doc = {
      a: 1,
      b: { c: 2, d: ["hello"], e: [1, 2, 3, undefined, 5] },
      f: [{ u: 0, v: 0 }, { u: 1, v: 1 }, { u: 2, v: 2 }, { v: 3 }]
    };
    it.each([
      ["b.e.1", { b: { e: [2] } }, {}],
      [
        "b.e.1",
        { a: 1, b: { c: 2, d: ["hello"], e: [2] }, f: doc.f },
        optsKeys
      ],
      ["b.e.1", { b: { e: [1, 2, 3, undefined, 5] } }, optsIndex],
      ["b.e.1", { b: { e: [2] } }, optsMissing],

      [
        "f.u",
        {
          f: [{ u: 0 }, { u: 1 }, { u: 2 }]
        },
        {}
      ],
      [
        "f.u",
        {
          a: 1,
          b: { c: 2, d: ["hello"], e: [1, 2, 3, undefined, 5] },
          f: [
            { u: 0, v: 0 },
            { u: 1, v: 1 },
            { u: 2, v: 2 }
          ]
        },
        optsKeys
      ],
      ["f.u", { f: [{ u: 0 }, { u: 1 }, { u: 2 }, undefined] }, optsIndex],
      ["f.u", { f: [{ u: 0 }, { u: 1 }, { u: 2 }, MISSING] }, optsMissing]
    ])(
      "%#. resolves object graph with appropriate options: (%s, %o, %o)",
      (path, expected, opts) => {
        const result = resolveGraph(doc, path, opts);
        expect(result).toEqual(expected);
      }
    );
  });

  describe("unique", () => {
    it("returns stable unique items from duplicates", () => {
      expect(unique([1, 2, 2, 1])).toEqual([1, 2]);
      expect(unique([5, [2], 3, [2], 1])).toEqual([5, [2], 3, 1]);
    });
  });

  describe("intersection", () => {
    it("should return empty set for empty inputs", () => {
      const res = intersection([]);
      expect(res).toEqual([]);
    });

    it("should find empty intersection when non exists", () => {
      const res = intersection([
        [1, 2, 3],
        [4, 5, 6],
        [5, 6, 7]
      ]);
      expect(res).toEqual([]);
    });

    it("should find intersection of multiple arrays", () => {
      const res = intersection([
        [1, 2, 3],
        [3, 6, 2, 3], // include duplicates
        [4, 5, 3]
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

    it("should return copy of first array if input size is 1", () => {
      expect(intersection([[1, 2, 3]])).toEqual([1, 2, 3]);
    });
  });

  describe("truthy", () => {
    // [value, expected, mode]
    it.each([
      ["", true, true],
      ["", false, false],
      ["non-empty", true, true],
      ["non-empty", true, false],
      [0, false, true],
      [0, false, false],
      [1, true, true],
      [1, true, false],
      [[], true, true],
      [[], true, false],
      [false, false, true],
      [false, false, false],
      [true, true, true],
      [true, true, false],
      [null, false, true],
      [null, false, false],
      [undefined, false, true],
      [undefined, false, false]
    ])("coerce %o -> %o if strict=%o", (value, output, mode) => {
      expect(truthy(value, mode)).toEqual(output);
    });
  });

  describe("walk", () => {
    let o: AnyObject = {};
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
      expect(has(resolve(o, "a.b") as AnyObject, "d")).toEqual(false);

      walk(o, "a.b.d.e", () => counter++, { buildGraph: true });
      expect(has(resolve(o, "a.b") as AnyObject, "d")).toEqual(true);
    });

    it("throws when selector contains __proto__ anywhere in the path", () => {
      expect(() => walk(o, "__proto__", () => {})).toThrow(/__proto__/);
      expect(() => walk(o, "a.__proto__.b", () => {})).toThrow(/__proto__/);
      expect(() => walk(o, "a.b.__proto__", () => {})).toThrow(/__proto__/);
    });
  });

  describe("HashMap", () => {
    it("should process map methods correctly", () => {
      const m = HashMap.init();

      // set
      m.set(100, 100)
        .set("string", "100")
        .set([1, 2], { a: 3 })
        .set([1, 2], { a: 1 }) // replace
        .set({ a: 1 }, [1, 2])
        .set({ a: 1 }, [2, 1]); // replace

      // has
      expect(m.has(100)).toEqual(true);
      expect(m.has("string")).toEqual(true);
      expect(m.has([1, 2])).toEqual(true);
      expect(m.has({ a: 1 })).toEqual(true);
      expect(m.has("hello")).toEqual(false);

      // size
      expect(m.size).toEqual(4);

      // get
      expect(m.get([1, 2])).toEqual({ a: 1 });
      expect(m.get({ a: 1 })).toEqual([2, 1]);

      // keys
      expect(Array.from(m.keys()).length).toEqual(4);

      // delete
      expect(m.delete({ a: 1 })).toEqual(true);
      expect(m.delete({ a: 1 })).toEqual(false);
      expect(m.size).toEqual(3);

      // clear
      m.clear();
      expect(m.size).toEqual(0);
      expect(m.get([1, 2])).toBeUndefined();
      expect(m.get({ a: 1 })).toBeUndefined();
    });
  });

  describe("hashCode", () => {
    const smallObject = { a: 1, b: "x", c: true };

    const mediumObject = {
      id: 123,
      name: "Alice",
      tags: ["dev", "ops", "infra"],
      meta: { active: true, score: 99.5 },
      created: new Date()
    };

    const deepObject = {
      level1: {
        level2: {
          level3: {
            arr: [1, 2, 3, { nested: "value" }]
          }
        }
      }
    };

    const cycleObject: AnyObject = { name: "cycle", self: undefined };
    cycleObject.self = cycleObject;

    const cycleArray: unknown[] = Array.from({ length: 10 }, (_, i) => i);
    cycleArray[0] = cycleArray;

    class Node {
      public next: Node | undefined = undefined;
    }
    const cycleNode = new Node();
    cycleNode.next = cycleNode;

    const samples = [
      undefined,
      null,
      NaN,
      Infinity,
      -Infinity,
      0,
      1,
      -1,
      "0",
      3.14,
      -3.14,
      true,
      false,
      ObjectId("123"), // custom class
      smallObject,
      mediumObject,
      deepObject,
      cycleObject,
      cycleArray,
      cycleNode,
      Uint8Array.from({ length: 256 }, () => (Math.random() * 256) | 0),
      (a: number) => a * 2, // function
      Array.from({ length: 200 }, (_, i) => i),
      makeRandomString(24),
      123456789,
      -123456789,
      // bigints
      0n,
      12345678901234567890n,
      -12345678901234567890n,
      // native objects
      new Date(),
      new Set(),
      new Map(),
      /abc/gi
    ];

    it("should hash values of different types", () => {
      const result = samples.map(hashCode);
      const set = new Set(result);
      expect(result.length).toEqual(set.size);
    });

    it("should hash equivalent values identically", () => {
      expect(hashCode(0)).toEqual(hashCode(-0));
      expect(hashCode(0n)).toEqual(hashCode(-0n));
      expect(hashCode(NaN)).toEqual(hashCode(-NaN));
    });
  });
});
