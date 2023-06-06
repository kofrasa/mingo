import { $unset } from "../../../src/operators/update";

describe("operators/update/unset", () => {
  it("Unset Fields in the Object", () => {
    const state = { item: "chisel", sku: "C001", quantity: 4, instock: true };
    expect($unset(state, { quantity: "", instock: "" })).toEqual([
      "quantity",
      "instock"
    ]);
    expect(state).toEqual({
      item: "chisel",
      sku: "C001"
    });
  });
});
