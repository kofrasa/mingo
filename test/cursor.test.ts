import { Query } from "../src";
import * as samples from "./support";

describe("Cursor", () => {
  // create a query with no criteria
  const query = new Query({});
  const newCursor = () => query.find(samples.simpleGradesData);

  it("should pass all navigation methods", () => {
    const cursor = newCursor();
    cursor.skip(10).limit(10);
    expect(cursor.hasNext()).toEqual(true);
    expect(cursor.next()).toBeTruthy();
    // cursor.next consumed 1 result
    expect(cursor.count()).toEqual(9);
    expect(cursor.hasNext()).toBe(false);
  });

  it("can iterate with forEach", () => {
    const cursor = newCursor();
    cursor.forEach((x) => x);
    expect(cursor.next()).toBeFalsy();
  });

  it("can iterate with map", () => {
    const cursor = newCursor();
    cursor.map((x) => typeof x).every((x) => typeof x === "boolean");
    expect(cursor.next()).toBeFalsy();
  });

  it("can sort with collation", () => {
    const cursor = new Query({}).find([
      { name: "John" },
      { name: "Bob" },
      { name: "Casey" },
      { name: "Alice" },
    ]);

    cursor.sort({ name: 1 }).collation({ locale: "en" });

    expect(cursor.next()).toStrictEqual({ name: "Alice" });
    expect(cursor.hasNext()).toEqual(true);
    expect(cursor.next()).toStrictEqual({ name: "Bob" });
    expect(cursor.hasNext()).toEqual(true);
    expect(cursor.next()).toStrictEqual({ name: "Casey" });
    expect(cursor.hasNext()).toEqual(true);
    expect(cursor.all()).toStrictEqual([{ name: "John" }]);
    expect(cursor.next()).toEqual(undefined);
    expect(cursor.hasNext()).toEqual(false);
    expect(cursor.all()).toStrictEqual([]);
  });
});
