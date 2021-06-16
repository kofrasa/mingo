import test from "tape";

import { RawObject } from "../src/types";
import { isEmpty, isEqual, isObject, sortBy } from "../src/util";

test("Test isEqual", (t) => {
  const sample = [
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
  let b = true;
  sample.forEach((arr) => {
    const r = isEqual(arr[0], arr[1]);
    b = b && r === arr[2];
    if (!b)
      t.ok(
        false,
        "failed test: " +
          JSON.stringify(arr[0]) +
          " = " +
          JSON.stringify(arr[1])
      );
  });
  t.ok(true, "all pass");
  t.end();
});

test("sortBy util", (t) => {
  t.deepEqual(
    sortBy(["c", "a", "function", "constructor"], (k) => k),
    ["a", "c", "constructor", "function"],
    "can sort by 'constructor' key"
  );
  t.end();
});

test("Test isObject", (t) => {
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
    t.equal(isObject(arr[0]), arr[1], arr[2]);
  });

  t.end();
});

test("isEmpty util", (t) => {
  const sample = ["0", 0, null, {}, "", []];
  t.deepEqual(
    sample.map((x) => isEmpty(x)),
    [false, false, true, true, true, true],
    "pass test"
  );
  t.end();
});
