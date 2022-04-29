import { Query, remove } from "../src";

describe("Query", () => {
  it("remove", () => {
    const result = remove(
      [{ name: "Colt" }, { name: "Ada" }, { name: "Xavier" }, { name: "Puma" }],
      { name: { $regex: /a$/ } }
    );
    expect(result).toStrictEqual([{ name: "Colt" }, { name: "Xavier" }]);
  });

  it("queries deeply nested arrays", () => {
    const query = new Query({ "children.children.flags": "foobar" });
    const result = query.test({
      children: [
        {
          children: [
            {
              flags: ["foobar"],
            },
          ],
        },
        {
          children: [
            {
              flags: [],
            },
          ],
        },
      ],
    });

    expect(result).toBe(true);
  });
});
