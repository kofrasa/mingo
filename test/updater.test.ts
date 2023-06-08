import "./support";

import { clone } from "../src/operators/update/_internal";
import { updateObject } from "../src/updater";

describe("updateObject", () => {
  const obj = {};
  beforeEach(() => {
    Object.assign(obj, { name: "John", age: 30 });
  });

  it("should contain single operator in expression", () => {
    const expr = { $set: { name: "Fred" } };
    expr["$inc"] = { age: 2 };
    expect(() => updateObject(obj, expr)).toThrowError(
      /must contain only one operator/
    );
  });

  it("should contain valid operator in expression", () => {
    const expr = { $set: { name: "Fred" } };
    expr["$cos"] = { age: 2 };
    delete expr["$set" as string];
    expect(() => updateObject(obj, expr)).toThrowError(
      /operator '\$cos' is not supported/
    );
  });

  it("should check condition before update", () => {
    expect(
      updateObject(obj, { $set: { name: "Fred" } }, [], { age: { $lt: 10 } })
    ).toEqual([]);
    expect(obj).toEqual({ name: "John", age: 30 });
  });

  it("should apply update on valid condition", () => {
    expect(
      updateObject(obj, { $set: { name: "Fred" } }, [], { age: { $gt: 10 } })
    ).toEqual(["name"]);
    expect(obj).toEqual({ name: "Fred", age: 30 });
  });

  // adding for completeness
  it("should clone with valid option", () => {
    expect(clone("deep", { a: 1 })).toEqual({ a: 1 });
    expect(clone("structured", { a: 1 })).toEqual({ a: 1 });
    expect(clone("none", { a: 1 })).toEqual({ a: 1 });
  });
});
