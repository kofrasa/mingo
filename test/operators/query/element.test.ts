import "../../../src/init/system";

import { Query } from "../../../src";
import { RawObject } from "../../../src/types";

describe("operators/query/element", () => {
  const obj = {
    double: 12323.4,
    string: "me",
    obj: {},
    array: [],
    boolean: true,
    date: new Date(),
    nothing: null,
    regex: /ab/,
    int: 49023,
    long: Math.pow(2, 32),
    decimal: 20.7823e10,
  };

  describe("$ype", () => {
    const queries = [
      [{ double: { $type: 1 } }, 'can match $type 1 "double"'],
      [{ string: { $type: 2 } }, 'can match $type 2 "string"'],
      [{ obj: { $type: 3 } }, 'can match $type 3 "object"'],
      [{ array: { $type: 4 } }, 'can match $type 4 "array"'],
      [{ missing: { $type: 6 } }, 'can match $type 6 "undefined"'],
      [{ boolean: { $type: 8 } }, 'can match $type 8 "boolean"'],
      [{ date: { $type: 9 } }, 'can match $type 9 "date"'],
      [{ nothing: { $type: 10 } }, 'can match $type 10 "null"'],
      [{ regex: { $type: 11 } }, 'can match $type 11 "regexp"'],
      [{ int: { $type: 16 } }, 'can match $type 16 "int"'],
      [{ long: { $type: 18 } }, 'can match $type 18 "long"'],
      [{ decimal: { $type: 19 } }, 'can match $type 19 "decimal"'],
      [{ obj: { $not: { $type: 100 } } }, "do not match unknown $type"],
      // { $type: array }
      [{ double: { $type: [1] } }, 'can match $type [1] "double"'],
      [{ double: { $type: [1, 4] } }, 'can match $type [1, 4] "double"'],
      [{ array: { $type: [1, 4] } }, 'can match $type [1, 4] "array"'],
      [{ double: { $not: { $type: [] } } }, "do not match $type []"],
    ];

    queries.forEach(function (arr) {
      const [criteria, message] = arr;
      it(message as string, () => {
        const query = new Query(criteria as RawObject);
        expect(query.test(obj)).toEqual(true);
      });
    });
  });
});
