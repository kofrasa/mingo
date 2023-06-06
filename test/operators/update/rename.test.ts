import "../../support";

import { $rename } from "../../../src/operators/update";

describe("operators/update/rename", () => {
  it("Rename a Field", () => {
    const state = {
      _id: 1,
      alias: ["The American Cincinnatus", "The American Fabius"],
      mobile: "555-555-5555",
      nmae: { first: "george", last: "washington" }
    };
    expect($rename(state, { nmae: "name" })).toEqual(["nmae", "name"]);
    expect(state).toEqual({
      _id: 1,
      alias: ["The American Cincinnatus", "The American Fabius"],
      mobile: "555-555-5555",
      name: { first: "george", last: "washington" }
    });
  });

  it("Rename a Field in an Embedded Document", () => {
    const state = {
      _id: 1,
      alias: ["The American Cincinnatus", "The American Fabius"],
      mobile: "555-555-5555",
      name: { first: "george", last: "washington" }
    };
    expect($rename(state, { "name.first": "name.fname" })).toEqual([
      "name.first",
      "name.fname"
    ]);
    expect(state).toEqual({
      _id: 1,
      alias: ["The American Cincinnatus", "The American Fabius"],
      mobile: "555-555-5555",
      name: { last: "washington", fname: "george" }
    });
  });

  it("Rename a Field That Does Not Exist", () => {
    const state = {
      _id: 1,
      alias: ["The American Cincinnatus", "The American Fabius"],
      mobile: "555-555-5555",
      name: { last: "washington", fname: "george" }
    };
    expect($rename(state, { wife: "spouse" })).toEqual([]);
    expect(state).toEqual({
      _id: 1,
      alias: ["The American Cincinnatus", "The American Fabius"],
      mobile: "555-555-5555",
      name: { last: "washington", fname: "george" }
    });
  });

  it("Rename Deeply Nested Field to Top-Level", () => {
    const state = {
      accounts: [{ n: 100 }, { n: 200 }, { n: 300 }]
    };
    expect(
      $rename(state, { "accounts.$[elem].n": "first" }, [{ "elem.n": 100 }])
    ).toEqual(["accounts", "first"]);
    expect(state).toEqual({
      accounts: [{}, { n: 200 }, { n: 300 }],
      first: 100
    });
  });

  it("Rename Deeply Nested Field With Filters", () => {
    const state = {
      accounts: [{ n: 100 }, { n: 200 }, { n: 300 }]
    };
    expect(
      $rename(state, { "accounts.$[elem].n": "accounts.$[elem].m" }, [
        { "elem.n": 200 }
      ])
    ).toEqual(["accounts"]);
    expect(state).toEqual({
      accounts: [{ n: 100 }, { m: 200 }, { n: 300 }]
    });
  });

  it("Rename Deeply Nested Field In-place", () => {
    const state = {
      accounts: [{ n: 100 }, { n: 200 }, { n: 300 }]
    };
    expect($rename(state, { "accounts.2.n": "accounts.2.w" })).toEqual([
      "accounts.2.n",
      "accounts.2.w"
    ]);
    expect(state).toEqual({
      accounts: [{ n: 100 }, { n: 200 }, { w: 300 }]
    });
  });
});
