import "../../src/init/system";

import { aggregate } from "../../src";

describe("expression/misc", () => {
  describe("$rand", () => {
    it("returns random objects", () => {
      const data = [
        { name: "Archibald", voterId: 4321, district: 3, registered: true },
        { name: "Beckham", voterId: 4331, district: 3, registered: true },
        { name: "Carolin", voterId: 5321, district: 4, registered: true },
        { name: "Debarge", voterId: 4343, district: 3, registered: false },
        { name: "Eckhard", voterId: 4161, district: 3, registered: false },
        { name: "Faberge", voterId: 4300, district: 1, registered: true },
        { name: "Grimwald", voterId: 4111, district: 3, registered: true },
        { name: "Humphrey", voterId: 2021, district: 3, registered: true },
        { name: "Idelfon", voterId: 1021, district: 4, registered: true },
        { name: "Justo", voterId: 9891, district: 3, registered: false },
      ];
      const q = () =>
        aggregate(data, [
          { $match: { district: 3 } },
          { $match: { $expr: { $lt: [0.5, { $rand: {} }] } } },
          { $project: { _id: 0, name: 1, registered: 1 } },
        ]);

      expect(q()).not.toEqual(q());
    });
  });
});
