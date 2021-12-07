import { remove } from "../src";

describe("Query", () => {
  it("remove", () => {
    const result = remove(
      [{ name: "Colt" }, { name: "Ada" }, { name: "Xavier" }, { name: "Puma" }],
      { name: { $regex: /a$/ } }
    );
    expect(result).toStrictEqual([{ name: "Colt" }, { name: "Xavier" }]);
  });
});
