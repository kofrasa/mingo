import { find, Query, remove } from "../src";

describe("Query", () => {
  it("should remove matching conditions", () => {
    const result = remove(
      [{ name: "Colt" }, { name: "Ada" }, { name: "Xavier" }, { name: "Puma" }],
      { name: { $regex: /a$/ } }
    );
    expect(result).toStrictEqual([{ name: "Colt" }, { name: "Xavier" }]);
  });

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
  });
});
