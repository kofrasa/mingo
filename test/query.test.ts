import { find, Query, test } from "../src";

describe("Query", () => {
  it("should query deeply nested arrays", () => {
    const query = new Query({ "children.children.flags": "foobar" });
    const result = query.test({
      children: [
        {
          children: [
            {
              flags: ["foobar"]
            }
          ]
        },
        {
          children: [
            {
              flags: []
            }
          ]
        }
      ]
    });

    expect(result).toBe(true);
  });

  it("should fail for unknown operator", () => {
    expect(() => find([{ a: 1 }], { a: { $cut: 3 } }, { a: 1 }).all()).toThrow(
      /unknown query operator/
    );
    expect(() => test({ a: 1 }, { a: { $cut: 3 } })).toThrow(
      /unknown query operator/
    );
  });

  it("should correctly test predicates", () => {
    expect(
      test({ a: 1 }, { $and: [{ a: { $gt: 0 } }, { a: { $lt: 2 } }] })
    ).toBe(true);
    expect(
      test({ a: 1 }, { $and: [{ a: { $lt: 0 } }, { a: { $lt: 2 } }] })
    ).toBe(false);
  });
});
