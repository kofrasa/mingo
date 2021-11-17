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

  it("forEach", () => {
    const cursor = newCursor();
    cursor.forEach((x) => x);
    expect(cursor.next()).toBeFalsy();
  });

  it("map", () => {
    const cursor = newCursor();
    cursor.map((x) => typeof x).every((x) => typeof x === "boolean");
    expect(cursor.next()).toBeFalsy();
  });
});
