import "../../src/init/system";

import test from "tape";

import { Query } from "../../src";
import { RawArray, RawObject } from "../../src/types";
import * as samples from "../support";

class ObjectId {
  constructor(readonly _id: string) {}
}

const idStr = "123456789abe";
const obj = Object.assign({}, samples.personData, { _id: new ObjectId(idStr) });

test("Logical Operators", (t) => {
  const queries: Array<RawArray> = [
    [
      { $and: [{ firstName: "Francis" }, { lastName: /^a.+e/i }] },
      "can use conjunction true AND true",
    ],
    [
      { $and: [{ firstName: "Francis" }, { lastName: "Amoah" }] },
      false,
      "can use conjunction true AND false",
    ],
    [
      { $and: [{ firstName: "Enoch" }, { lastName: "Asante" }] },
      false,
      "can use conjunction false AND true",
    ],
    [
      { $and: [{ firstName: "Enoch" }, { age: { $exists: true } }] },
      false,
      "can use conjunction false AND false",
    ],
    // or
    [
      { $or: [{ firstName: "Francis" }, { lastName: /^a.+e/i }] },
      "can use conjunction true OR true",
    ],
    [
      { $or: [{ firstName: "Francis" }, { lastName: "Amoah" }] },
      "can use conjunction true OR false",
    ],
    [
      { $or: [{ firstName: "Enoch" }, { lastName: "Asante" }] },
      "can use conjunction false OR true",
    ],
    [
      { $or: [{ firstName: "Enoch" }, { age: { $exists: true } }] },
      false,
      "can use conjunction false OR false",
    ],
    // nor
    [
      { $nor: [{ firstName: "Francis" }, { lastName: /^a.+e/i }] },
      false,
      "can use conjunction true NOR true",
    ],
    [
      { $nor: [{ firstName: "Francis" }, { lastName: "Amoah" }] },
      false,
      "can use conjunction true NOR false",
    ],
    [
      { $nor: [{ firstName: "Enoch" }, { lastName: "Asante" }] },
      false,
      "can use conjunction false NOR true",
    ],
    [
      { $nor: [{ firstName: "Enoch" }, { age: { $exists: true } }] },
      "can use conjunction false NOR false",
    ],
  ];

  queries.forEach(function (q) {
    if (q.length === 2) {
      t.ok(new Query(q[0] as RawObject).test(obj), q[1] as string);
    } else if (q.length === 3) {
      t.equal(new Query(q[0] as RawObject).test(obj), q[1], q[2] as string);
    }
  });

  t.end();
});
