import "../../../src/init/system";

import { Query } from "../../../src";
import { RawArray } from "../../../src/types";
import { ObjectId, personData } from "../../support";

const idStr = "123456789abe";
const obj = Object.assign({}, personData, { _id: new ObjectId(idStr) });

describe("operators/query/logical", () => {
  const fixtures: Record<string, Array<RawArray>> = {
    $and: [
      [
        [{ firstName: "Francis" }, { lastName: /^a.+e/i }],
        "can use conjunction true AND true",
      ],
      [
        [{ firstName: "Francis" }, { lastName: "Amoah" }],
        false,
        "can use conjunction true AND false",
      ],
      [
        [{ firstName: "Enoch" }, { lastName: "Asante" }],
        false,
        "can use conjunction false AND true",
      ],
      [
        [{ firstName: "Enoch" }, { age: { $exists: true } }],
        false,
        "can use conjunction false AND false",
      ],
    ],
    $or: [
      [
        [{ firstName: "Francis" }, { lastName: /^a.+e/i }],
        "can use conjunction true OR true",
      ],
      [
        [{ firstName: "Francis" }, { lastName: "Amoah" }],
        "can use conjunction true OR false",
      ],
      [
        [{ firstName: "Enoch" }, { lastName: "Asante" }],
        "can use conjunction false OR true",
      ],
      [
        [{ firstName: "Enoch" }, { age: { $exists: true } }],
        false,
        "can use conjunction false OR false",
      ],
    ],
    $nor: [
      [
        [{ firstName: "Francis" }, { lastName: /^a.+e/i }],
        false,
        "can use conjunction true NOR true",
      ],
      [
        [{ firstName: "Francis" }, { lastName: "Amoah" }],
        false,
        "can use conjunction true NOR false",
      ],
      [
        [{ firstName: "Enoch" }, { lastName: "Asante" }],
        false,
        "can use conjunction false NOR true",
      ],
      [
        [{ firstName: "Enoch" }, { age: { $exists: true } }],
        "can use conjunction false NOR false",
      ],
    ],
  };

  for (const [op, suite] of Object.entries(fixtures)) {
    describe(op, () => {
      suite.forEach((arr: RawArray) => {
        const [criteria, result, message] = arr;
        it((message || result) as string, () => {
          if (!message) {
            expect(new Query({ [op]: criteria }).test(obj)).toEqual(true);
          } else {
            expect(new Query({ [op]: criteria }).test(obj)).toEqual(result);
          }
        });
      });
    });
  }
});
