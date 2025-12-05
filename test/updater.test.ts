import { find, update, updateMany, updateOne } from "../src";
import { ComputeOptions } from "../src/core/_internal";
import { clone, Trie } from "../src/operators/update/_internal";
import { isArray } from "../src/util";
import { ISODate } from "./support";

describe("updater", () => {
  describe("Trie: Conflict Detection", () => {
    it("should detect conflicts for overlapping paths: nested -> root", () => {
      const trie = new Trie();
      expect(trie.add("name.firstname")).toBe(true);
      expect(trie.add("name.lastname")).toBe(true);
      expect(trie.add("name")).toBe(false);
      expect(trie.add("age")).toBe(true);
    });

    it("should detect conflicts for overlapping paths: root -> nested", () => {
      const trie = new Trie();
      expect(trie.add("name")).toBe(true);
      expect(trie.add("name.firstname")).toBe(false);
      expect(trie.add("address")).toBe(true);
      expect(trie.add("address.street.name")).toBe(false);
    });

    it("should not detect conflict for non-overlapping paths", () => {
      const trie = new Trie();
      expect(trie.add("name.firstname")).toBe(true);
      expect(trie.add("name.lastname")).toBe(true);
      expect(trie.add("address.street")).toBe(true);
      expect(trie.add("address.city")).toBe(true);
    });
  });

  describe("_id Immutability", () => {
    const ERR_MSG = /would modify the immutable field '_id'/;

    it("should FAIL when $set targets _id field", () => {
      const doc = { _id: "abc123", name: "John" };
      expect(() => update(doc, { $set: { _id: "xyz789" } })).toThrow(ERR_MSG);
    });

    it("should FAIL when $set targets nested _id field", () => {
      const doc = { _id: { a: 1, b: 2 }, name: "John" };
      expect(() => update(doc, { $set: { "_id.a": 3 } })).toThrow(ERR_MSG);
    });

    it("should FAIL when $unset targets _id field", () => {
      const doc = { _id: "abc123", name: "John" };
      expect(() => update(doc, { $unset: { _id: "" } })).toThrow(ERR_MSG);
    });

    it("should FAIL when $rename source is _id field", () => {
      const doc = { _id: "abc123", name: "John" };
      expect(() => update(doc, { $rename: { _id: "oldId" } })).toThrow(ERR_MSG);
    });

    it("should FAIL when $rename target is _id field", () => {
      const doc = { tempId: "abc123", name: "John" };
      expect(() => update(doc, { $rename: { tempId: "_id" } })).toThrow(
        ERR_MSG
      );
    });

    it("should FAIL when $rename target is nested _id path", () => {
      const doc = { tempId: "abc123", name: "John" };
      expect(() => update(doc, { $rename: { tempId: "_id.value" } })).toThrow(
        ERR_MSG
      );
    });

    it("should FAIL when $inc targets _id field", () => {
      const doc = { _id: 100, name: "John" };
      expect(() => update(doc, { $inc: { _id: 1 } })).toThrow(ERR_MSG);
    });

    it("should allow updating fields that contain 'id' but not '_id'", () => {
      const doc = { _id: "abc123", id: "old", myId: "test" };
      update(doc, { $set: { id: "new", myId: "updated" } });
      expect(doc.id).toBe("new");
      expect(doc.myId).toBe("updated");
      expect(doc._id).toBe("abc123");
    });

    it("should allow updating _id_backup field (not _id)", () => {
      const doc = { _id: "abc123", _id_backup: "old" };
      update(doc, { $set: { _id_backup: "new" } });
      expect(doc._id_backup).toBe("new");
      expect(doc._id).toBe("abc123");
    });
  });

  describe("update()", () => {
    const obj = {};
    beforeEach(() => {
      Object.assign(obj, { name: "John", age: 30 });
    });

    it("should allow multiple selectors with same parent conflict", () => {
      const state = { name: { firstname: "John", lastname: "Wick" }, age: 30 };
      update(state, {
        $set: { "name.firstname": "Freddy", "name.lastname": "Mercury" }
      });
      expect(state.name.firstname).toBe("Freddy");
      expect(state.name.lastname).toBe("Mercury");
    });

    it("should FAIL if multiple selectors on same operator have path conflict", () => {
      const state = { name: { firstname: "John", lastname: "Wick" }, age: 30 };
      expect(() =>
        update(state, {
          $set: { "name.firstname": "Freddy", name: { firstname: "John" } }
        })
      ).toThrow();
    });

    it("should FAIL if multiple selectors on different operators have path conflict", () => {
      const state = { name: { firstname: "John", lastname: "Wick" }, age: 30 };
      expect(() =>
        update(state, {
          $set: { "name.firstname": "Freddy", name: { firstname: "John" } }
        })
      ).toThrow();
    });

    it("should contain valid operator in expression", () => {
      const expr = { $set: { name: "Fred" } };
      expr["$cos"] = { age: 2 };
      delete expr["$set" as string];
      expect(() => update(obj, expr)).toThrow(
        /Unknown update operator: '\$cos'/
      );
    });

    it("should check condition before update", () => {
      expect(
        update(obj, { $set: { name: "Fred" } }, [], { age: { $lt: 10 } })
      ).toEqual([]);
      expect(obj).toEqual({ name: "John", age: 30 });
    });

    it("should apply update on valid condition expression", () => {
      expect(
        update(obj, { $set: { name: "Fred" } }, [], { age: { $gt: 10 } })
      ).toEqual(["name"]);
      expect(obj).toEqual({ name: "Fred", age: 30 });
    });

    it("should not apply update on invalid condition expression", () => {
      expect(obj).toEqual({ name: "John", age: 30 });
      expect(update(obj, { $set: { name: "Fred" } }, [], { age: 10 })).toEqual(
        []
      );
      expect(obj).toEqual({ name: "John", age: 30 });
    });

    it("should apply update on valid condition query", () => {
      expect(
        update(obj, { $set: { name: "Fred" } }, [], { age: { $gt: 10 } })
      ).toEqual(["name"]);
      expect(obj).toEqual({ name: "Fred", age: 30 });
    });

    const opts = ComputeOptions.init({});
    it.each([{ a: 1 }, [{ a: 1 }], new Date("2022-02-01")])(
      "should apply clone mode: %p",
      val => {
        opts.update({ updateConfig: { cloneMode: "deep" } });
        const a = clone(val, opts);
        opts.update({ updateConfig: { cloneMode: "copy" } });
        const b = clone(val, opts);
        opts.update({ updateConfig: { cloneMode: "none" } });
        const c = clone(val, opts);

        expect(val).toEqual(a);
        expect(val).toEqual(b);
        expect(val).toEqual(c);

        expect(val).not.toBe(a);
        expect(val).not.toBe(b);
        expect(val).toBe(c);

        if (isArray(val)) {
          expect(val[0]).not.toBe((a as unknown[])[0]);
          expect(val[0]).toBe((b as unknown[])[0]);
          expect(val[0]).toBe((c as unknown[])[0]);
        }
      }
    );

    it("should return correct updated paths", () => {
      const obj = {
        firstName: "John",
        lastName: "Wick",
        age: 40,
        friends: ["Scooby", "Shagy", "Fred"]
      };

      // returns array of modified paths if value changed.
      expect(
        update(obj, { $set: { firstName: "Bob", lastName: "Doe" } })
      ).toEqual(["firstName", "lastName"]);

      // update nested values.
      expect(update(obj, { $pop: { friends: 1 } })).toEqual(["friends"]);
      expect(obj.friends).toEqual(["Scooby", "Shagy"]);

      // update nested value path
      expect(update(obj, { $unset: { "friends.1": "" } })).toEqual([
        "friends.1"
      ]);
      expect(obj.friends).toEqual(["Scooby", null]);

      // update with condition
      expect(
        update(obj, { $set: { "friends.$[e]": "Velma" } }, [{ e: null }])
      ).toEqual(["friends"]);
      expect(obj.friends).toEqual(["Scooby", "Velma"]);

      // empty array returned if value has not changed.
      expect(update(obj, { $set: { firstName: "Bob" } })).toEqual([]);
    });

    it("should update positional nested in deep object", () => {
      const obj = {
        first: {
          second: {
            third: [20, 5, 91, 300, 400]
          }
        }
      };
      expect(
        update(obj, { $set: { "first.second.third.$[elem]": 0 } }, [
          { elem: { $gt: 100 } }
        ])
      ).toEqual(["first.second.third"]);
      expect(obj).toEqual({
        first: {
          second: {
            third: [20, 5, 91, 0, 0]
          }
        }
      });
    });

    it("should update with multiple modifers and return fields", () => {
      const state = {
        name: "Pizza Rat's Pizzaria",
        Borough: "Manhattan"
      };
      expect(
        update(state, { $inc: { violations: 3 }, $set: { Closed: true } })
      ).toEqual(["Closed", "violations"]);

      expect(state).toEqual({
        name: "Pizza Rat's Pizzaria",
        Borough: "Manhattan",
        violations: 3,
        Closed: true
      });
    });

    it("should fail when multiple modifiers selectors conflict", () => {
      const state = {
        items: ["ball", "bat", "gloves"]
      };
      expect(() =>
        update(state, { $set: { items: [] }, $pop: { items: 1 } })
      ).toThrow();

      expect(state).toEqual({
        items: ["ball", "bat", "gloves"]
      });
    });

    it("should update different nested path of parent selector with multiple modifiers", () => {
      const state = {
        items: ["ball", "bat", "gloves"]
      };
      expect(
        update(state, { $set: { "items.0": "lamp" }, $inc: { "items.3": 1 } })
      ).toEqual(["items.0", "items.3"]);

      expect(state).toEqual({
        items: ["lamp", "bat", "gloves", 1]
      });
    });
  });

  describe("updateMany() with expressions", () => {
    it("performs idempotent updates", () => {
      const employees = [
        { _id: 1, name: "Rob", salary: 37000 },
        { _id: 2, name: "Trish", salary: 65000 },
        { _id: 3, name: "Zeke", salary: 99999 },
        { _id: 4, name: "Mary", salary: 200000 }
      ];

      expect(
        updateMany(
          employees,
          { salary: { $lt: 100000 }, raiseApplied: { $ne: true } },
          { $inc: { salary: 1000 }, $set: { raiseApplied: true } }
        )
      ).toEqual({ matchedCount: 3, modifiedCount: 3 });
      expect(employees).toEqual([
        { _id: 1, name: "Rob", salary: 38000, raiseApplied: true },
        { _id: 2, name: "Trish", salary: 66000, raiseApplied: true },
        { _id: 3, name: "Zeke", salary: 100999, raiseApplied: true },
        { _id: 4, name: "Mary", salary: 200000 }
      ]);

      expect(
        updateMany(employees, {}, { $unset: { raiseApplied: 1 } })
      ).toEqual({ matchedCount: 4, modifiedCount: 3 });

      expect(employees).toEqual([
        { _id: 1, name: "Rob", salary: 38000 },
        { _id: 2, name: "Trish", salary: 66000 },
        { _id: 3, name: "Zeke", salary: 100999 },
        { _id: 4, name: "Mary", salary: 200000 }
      ]);
    });

    it("should Update Multiple Documents", () => {
      const restaurants = [
        { _id: 1, name: "Central Perk Cafe", violations: 3 },
        { _id: 2, name: "Rock A Feller Bar and Grill", violations: 2 },
        { _id: 3, name: "Empire State Sub", violations: 5 },
        { _id: 4, name: "Pizza Rat's Pizzaria", violations: 8 }
      ];

      expect(
        updateMany(
          restaurants,
          { violations: { $gt: 4 } },
          { $set: { Review: true } }
        )
      ).toEqual({ matchedCount: 2, modifiedCount: 2 });

      expect(restaurants).toEqual([
        { _id: 1, name: "Central Perk Cafe", violations: 3 },
        { _id: 2, name: "Rock A Feller Bar and Grill", violations: 2 },
        { _id: 3, name: "Empire State Sub", violations: 5, Review: true },
        { _id: 4, name: "Pizza Rat's Pizzaria", violations: 8, Review: true }
      ]);
    });
  });

  describe("updateMany() with pipeline", () => {
    it("Update with Aggregation Pipeline Using Existing Fields", () => {
      const students = [
        {
          _id: 1,
          student: "Skye",
          points: 75,
          commentsSemester1: "great at math",
          commentsSemester2: "loses temper",
          lastUpdate: ISODate("2019-01-01T00:00:00Z")
        },
        {
          _id: 2,
          student: "Elizabeth",
          points: 60,
          commentsSemester1: "well behaved",
          commentsSemester2: "needs improvement",
          lastUpdate: ISODate("2019-01-01T00:00:00Z")
        }
      ];

      const now = new Date();

      expect(
        updateMany(
          students,
          {},
          [
            {
              $set: {
                status: "Modified", // missing in MongoDB docs
                comments: ["$commentsSemester1", "$commentsSemester2"],
                lastUpdate: "$$now"
              }
            },
            { $unset: ["commentsSemester1", "commentsSemester2"] }
          ],
          {},
          { variables: { now } }
        )
      ).toEqual({ matchedCount: 2, modifiedCount: 2 });

      expect(students).toEqual([
        {
          _id: 1,
          student: "Skye",
          status: "Modified",
          points: 75,
          lastUpdate: now,
          comments: ["great at math", "loses temper"]
        },
        {
          _id: 2,
          student: "Elizabeth",
          status: "Modified",
          points: 60,
          lastUpdate: now,
          comments: ["well behaved", "needs improvement"]
        }
      ]);
    });

    it("Update with Aggregation Pipeline Using Existing Fields Conditionally", () => {
      const students = [
        {
          _id: 1,
          tests: [95, 92, 90],
          lastUpdate: ISODate("2019-01-01T00:00:00Z")
        },
        {
          _id: 2,
          tests: [94, 88, 90],
          lastUpdate: ISODate("2019-01-01T00:00:00Z")
        },
        {
          _id: 3,
          tests: [70, 75, 82],
          lastUpdate: ISODate("2019-01-01T00:00:00Z")
        }
      ];

      const now = new Date();
      const res = updateMany(
        students,
        {},
        [
          {
            $set: {
              average: { $trunc: [{ $avg: "$tests" }, 0] },
              lastUpdate: "$$now"
            }
          },
          {
            $set: {
              grade: {
                $switch: {
                  branches: [
                    { case: { $gte: ["$average", 90] }, then: "A" },
                    { case: { $gte: ["$average", 80] }, then: "B" },
                    { case: { $gte: ["$average", 70] }, then: "C" },
                    { case: { $gte: ["$average", 60] }, then: "D" }
                  ],
                  default: "F"
                }
              }
            }
          }
        ],
        {},
        { variables: { now } }
      );

      expect(res).toEqual({ matchedCount: 3, modifiedCount: 3 });

      expect(students).toEqual([
        {
          _id: 1,
          tests: [95, 92, 90],
          lastUpdate: now,
          average: 92,
          grade: "A"
        },
        {
          _id: 2,
          tests: [94, 88, 90],
          lastUpdate: now,
          average: 90,
          grade: "A"
        },
        {
          _id: 3,
          tests: [70, 75, 82],
          lastUpdate: now,
          average: 75,
          grade: "C"
        }
      ]);
    });
  });

  describe("updateOne() with expressions", () => {
    it("should update single document", () => {
      const restaurants = [
        { _id: 1, name: "Central Perk Cafe", Borough: "Manhattan" },
        {
          _id: 2,
          name: "Rock A Feller Bar and Grill",
          Borough: "Queens",
          violations: 2
        },
        { _id: 3, name: "Empire State Pub", Borough: "Brooklyn", violations: 0 }
      ];

      expect(
        updateOne(
          restaurants,
          { name: "Central Perk Cafe" },
          { $set: { violations: 3 } }
        )
      ).toEqual({
        matchedCount: 1,
        modifiedCount: 1,
        modifiedFields: ["violations"],
        modifiedIndex: 0
      });

      expect(restaurants).toEqual([
        {
          _id: 1,
          name: "Central Perk Cafe",
          Borough: "Manhattan",
          violations: 3
        },
        {
          _id: 2,
          name: "Rock A Feller Bar and Grill",
          Borough: "Queens",
          violations: 2
        },
        { _id: 3, name: "Empire State Pub", Borough: "Brooklyn", violations: 0 }
      ]);
    });

    it("should update with sort with filter specified", () => {
      const people = [
        { name: "Alice", state: "active", rating: 5 },
        { name: "Bob", state: "active", rating: 3 },
        { name: "Charlie", state: "active", rating: 4 },
        { name: "Diana", state: "inactive", rating: 2 },
        { name: "Eve", state: "active", rating: 1 },
        { name: "Frank", state: "inactive", rating: 6 }
      ];

      expect(
        updateOne(
          people,
          { state: "active" },
          { $set: { state: "inactive" } },
          { sort: { rating: 1 } }
        )
      ).toEqual({
        matchedCount: 1,
        modifiedCount: 1,
        modifiedFields: ["state"],
        modifiedIndex: 4
      });

      expect(people).toEqual([
        { name: "Alice", state: "active", rating: 5 },
        { name: "Bob", state: "active", rating: 3 },
        { name: "Charlie", state: "active", rating: 4 },
        { name: "Diana", state: "inactive", rating: 2 },
        { name: "Eve", state: "inactive", rating: 1 },
        { name: "Frank", state: "inactive", rating: 6 }
      ]);
    });

    it("should update with sort with empty filter specified", () => {
      const people = [
        { name: "Alice", state: "active", rating: 5 },
        { name: "Bob", state: "active", rating: 3 },
        { name: "Charlie", state: "active", rating: 4 },
        { name: "Diana", state: "inactive", rating: 2 },
        { name: "Eve", state: "active", rating: 1 },
        { name: "Frank", state: "inactive", rating: 6 }
      ];

      expect(
        updateOne(
          people,
          {},
          { $set: { state: "active" } },
          { sort: { rating: -1 } }
        )
      ).toEqual({
        matchedCount: 1,
        modifiedCount: 1,
        modifiedFields: ["state"],
        modifiedIndex: 5
      });

      expect(people).toEqual([
        { name: "Alice", state: "active", rating: 5 },
        { name: "Bob", state: "active", rating: 3 },
        { name: "Charlie", state: "active", rating: 4 },
        { name: "Diana", state: "inactive", rating: 2 },
        { name: "Eve", state: "active", rating: 1 },
        { name: "Frank", state: "active", rating: 6 }
      ]);
    });

    it("should update with collation", () => {
      const items = [
        { _id: 1, category: "café", status: "A" },
        { _id: 2, category: "cafe", status: "a" },
        { _id: 3, category: "cafE", status: "a" }
      ];

      expect(
        updateOne(
          items,
          { category: "cafe" },
          { $set: { status: "Updated" } },
          {},
          { collation: { locale: "fr", strength: 1 } }
        )
      ).toEqual({
        matchedCount: 1,
        modifiedCount: 1,
        modifiedFields: ["status"],
        modifiedIndex: 1
      });

      expect(items).toEqual([
        {
          _id: 1,
          category: "café",
          status: "A"
        },
        {
          _id: 2,
          category: "cafe",
          status: "Updated"
        },
        {
          _id: 3,
          category: "cafE",
          status: "a"
        }
      ]);
    });

    it("Update Elements Match arrayFilters Criteria", () => {
      const students = [
        { _id: 1, grades: [95, 92, 90] },
        { _id: 2, grades: [98, 100, 102] },
        { _id: 3, grades: [95, 110, 100] }
      ];

      expect(
        updateOne(
          students,
          { grades: { $gte: 100 } },
          { $set: { "grades.$[element]": 100 } },
          { arrayFilters: [{ element: { $gte: 100 } }] }
        )
      ).toEqual({
        matchedCount: 1,
        modifiedCount: 1,
        modifiedFields: ["grades"],
        modifiedIndex: 1
      });

      expect(students).toEqual([
        { _id: 1, grades: [95, 92, 90] },
        { _id: 2, grades: [98, 100, 100] },
        { _id: 3, grades: [95, 110, 100] }
      ]);
    });

    it("Update Specific Elements of an Array of Documents", () => {
      const students = [
        {
          _id: 1,
          grades: [
            { grade: 80, mean: 75, std: 6 },
            { grade: 85, mean: 90, std: 4 },
            { grade: 85, mean: 85, std: 6 }
          ]
        },
        {
          _id: 2,
          grades: [
            { grade: 90, mean: 75, std: 6 },
            { grade: 87, mean: 90, std: 3 },
            { grade: 85, mean: 85, std: 4 }
          ]
        }
      ];

      expect(
        updateOne(
          students,
          {},
          { $set: { "grades.$[elem].mean": 100 } },
          { arrayFilters: [{ "elem.grade": { $gte: 85 } }] }
        )
      ).toEqual({
        matchedCount: 1,
        modifiedCount: 1,
        modifiedFields: ["grades"],
        modifiedIndex: 0
      });

      expect(students).toEqual([
        {
          _id: 1,
          grades: [
            { grade: 80, mean: 75, std: 6 },
            { grade: 85, mean: 100, std: 4 },
            { grade: 85, mean: 100, std: 6 }
          ]
        },
        {
          _id: 2,
          grades: [
            { grade: 90, mean: 75, std: 6 },
            { grade: 87, mean: 90, std: 3 },
            { grade: 85, mean: 85, std: 4 }
          ]
        }
      ]);
    });
  });

  describe("updateOne() with pipeline", () => {
    it("Update with Aggregation Pipeline", () => {
      const students = [
        {
          _id: 1,
          student: "Skye",
          points: 75,
          commentsSemester1: "great at math",
          commentsSemester2: "loses temper",
          lastUpdate: ISODate("2019-01-01T00:00:00Z")
        },
        {
          _id: 2,
          student: "Elizabeth",
          points: 60,
          commentsSemester1: "well behaved",
          commentsSemester2: "needs improvement",
          lastUpdate: ISODate("2019-01-01T00:00:00Z")
        }
      ];

      const now = new Date();

      expect(
        updateOne(
          students,
          { _id: 1 },
          [
            {
              $set: {
                status: "Modified",
                comments: ["$commentsSemester1", "$commentsSemester2"],
                lastUpdate: "$$now"
              }
            },
            { $unset: ["commentsSemester1", "commentsSemester2"] }
          ],
          {},
          { variables: { now } }
        )
      ).toEqual({
        matchedCount: 1,
        modifiedCount: 1,
        modifiedFields: [
          "comments",
          "commentsSemester1",
          "commentsSemester2",
          "lastUpdate",
          "status"
        ],
        modifiedIndex: 0
      });

      expect(students).toEqual([
        {
          _id: 1,
          student: "Skye",
          status: "Modified",
          points: 75,
          lastUpdate: now,
          comments: ["great at math", "loses temper"]
        },
        {
          _id: 2,
          student: "Elizabeth",
          points: 60,
          commentsSemester1: "well behaved",
          commentsSemester2: "needs improvement",
          lastUpdate: ISODate("2019-01-01T00:00:00Z")
        }
      ]);
    });

    it("Update with Aggregation Pipeline Using Existing Fields Conditionally", () => {
      const students = [
        {
          _id: 1,
          tests: [95, 92, 90],
          average: 92,
          grade: "A",
          lastUpdate: ISODate("2020-01-23T05:18:40.013Z")
        },
        {
          _id: 2,
          tests: [94, 88, 90],
          average: 91,
          grade: "A",
          lastUpdate: ISODate("2020-01-23T05:18:40.013Z")
        },
        {
          _id: 3,
          tests: [70, 75, 82],
          lastUpdate: ISODate("2019-01-01T00:00:00Z")
        }
      ];

      const now = new Date();
      const res = updateOne(
        students,
        { _id: 3 },
        [
          {
            $set: {
              average: { $trunc: [{ $avg: "$tests" }, 0] },
              lastUpdate: "$$now"
            }
          },
          {
            $set: {
              grade: {
                $switch: {
                  branches: [
                    { case: { $gte: ["$average", 90] }, then: "A" },
                    { case: { $gte: ["$average", 80] }, then: "B" },
                    { case: { $gte: ["$average", 70] }, then: "C" },
                    { case: { $gte: ["$average", 60] }, then: "D" }
                  ],
                  default: "F"
                }
              }
            }
          }
        ],
        {},
        { variables: { now } }
      );

      expect(res).toEqual({
        matchedCount: 1,
        modifiedCount: 1,
        modifiedFields: ["average", "grade", "lastUpdate"],
        modifiedIndex: 2
      });

      expect(students).toEqual([
        {
          _id: 1,
          tests: [95, 92, 90],
          average: 92,
          grade: "A",
          lastUpdate: ISODate("2020-01-23T05:18:40.013Z")
        },
        {
          _id: 2,
          tests: [94, 88, 90],
          average: 91,
          grade: "A",
          lastUpdate: ISODate("2020-01-23T05:18:40.013Z")
        },
        {
          _id: 3,
          tests: [70, 75, 82],
          lastUpdate: now,
          average: 75,
          grade: "C"
        }
      ]);
    });

    it("should update only first document when no filter is provided", () => {
      const people = [
        { name: "Alice", state: "active", rating: 5 },
        { name: "Bob", state: "active", rating: 3 },
        { name: "Charlie", state: "active", rating: 4 },
        { name: "Diana", state: "inactive", rating: 2 },
        { name: "Eve", state: "active", rating: 1 },
        { name: "Frank", state: "inactive", rating: 6 }
      ];

      expect(updateOne(people, {}, [{ $set: { state: "inactive" } }])).toEqual({
        matchedCount: 1,
        modifiedCount: 1,
        modifiedFields: ["state"],
        modifiedIndex: 0
      });

      expect(people).toEqual([
        { name: "Alice", state: "inactive", rating: 5 },
        { name: "Bob", state: "active", rating: 3 },
        { name: "Charlie", state: "active", rating: 4 },
        { name: "Diana", state: "inactive", rating: 2 },
        { name: "Eve", state: "active", rating: 1 },
        { name: "Frank", state: "inactive", rating: 6 }
      ]);
    });

    it("should return correct results when no field is modified", () => {
      const people = [
        { name: "Alice", state: "active", rating: 5 },
        { name: "Bob", state: "active", rating: 3 },
        { name: "Charlie", state: "active", rating: 4 },
        { name: "Diana", state: "inactive", rating: 2 },
        { name: "Eve", state: "active", rating: 1 },
        { name: "Frank", state: "inactive", rating: 6 }
      ];

      expect(
        updateOne(people, { name: "Bob" }, [{ $set: { state: "active" } }])
      ).toEqual({
        matchedCount: 1,
        modifiedCount: 0
      });

      expect(people).toEqual([
        { name: "Alice", state: "active", rating: 5 },
        { name: "Bob", state: "active", rating: 3 },
        { name: "Charlie", state: "active", rating: 4 },
        { name: "Diana", state: "inactive", rating: 2 },
        { name: "Eve", state: "active", rating: 1 },
        { name: "Frank", state: "inactive", rating: 6 }
      ]);
    });

    it("should replace the entire object with $replaceRoot", () => {
      const obj = {
        country: "Ghana",
        continent: "Africa",
        flag: { red: true, yellow: true, black: true, green: true }
      };
      expect(
        updateOne([obj], {}, [
          {
            $replaceRoot: {
              newRoot: {
                country: "Togo",
                continent: "Africa",
                flag: { red: true, yellow: true, white: true, green: true }
              }
            }
          }
        ])
      ).toEqual({
        matchedCount: 1,
        modifiedCount: 1,
        modifiedIndex: 0,
        modifiedFields: ["country", "flag"]
      });
    });

    it("should remove array value with $unset", () => {
      const obj = {
        friends: ["Scooby", "Shagy", "Fred"]
      };
      expect(updateOne([obj], {}, [{ $unset: "friends.1" }])).toEqual({
        matchedCount: 1,
        modifiedCount: 1,
        modifiedIndex: 0,
        modifiedFields: ["friends"]
      });

      expect(obj).toEqual({
        friends: ["Scooby", "Fred"]
      });
    });
  });

  describe("Positional Operators", () => {
    it("Update Values in an Array", () => {
      const input = [
        { _id: 1, grades: [85, 80, 80] },
        { _id: 2, grades: [88, 90, 92] },
        { _id: 3, grades: [85, 100, 90] }
      ];
      const result = [
        { _id: 1, grades: [85, 82, 80] },
        { _id: 2, grades: [88, 90, 92] },
        { _id: 3, grades: [85, 100, 90] }
      ];

      input.forEach(o =>
        update(o, { $set: { "grades.$": 82 } }, [], { _id: 1, grades: 80 })
      );

      expect(input).toEqual(result);
    });

    it("Update Documents in an Array", () => {
      const input = {
        _id: 4,
        grades: [
          { grade: 80, mean: 75, std: 8 },
          { grade: 85, mean: 90, std: 5 },
          { grade: 85, mean: 85, std: 8 }
        ]
      };

      update(input, { $set: { "grades.$.std": 6 } }, [], {
        _id: 4,
        "grades.grade": 85
      });

      expect(input).toEqual({
        _id: 4,
        grades: [
          { grade: 80, mean: 75, std: 8 },
          { grade: 85, mean: 90, std: 6 },
          { grade: 85, mean: 85, std: 8 }
        ]
      });
    });

    it("Update Embedded Documents Using Multiple Field Matches", () => {
      const input = {
        _id: 5,
        grades: [
          { grade: 80, mean: 75, std: 8 },
          { grade: 85, mean: 90, std: 5 },
          { grade: 90, mean: 85, std: 3 }
        ]
      };

      expect(
        update(input, { $set: { "grades.$.std": 6 } }, [], {
          _id: 5,
          grades: { $elemMatch: { grade: { $lte: 90 }, mean: { $gt: 80 } } }
        })
      ).toEqual(["grades"]);

      expect(input).toEqual({
        _id: 5,
        grades: [
          { grade: 80, mean: 75, std: 8 },
          { grade: 85, mean: 90, std: 6 },
          { grade: 90, mean: 85, std: 3 }
        ]
      });
    });

    it("Update with Multiple Array Matches", () => {
      const input = {
        _id: 8,
        activity_ids: [1, 2],
        grades: [90, 95],
        deans_list: [2021, 2020]
      };

      expect(
        update(input, { $set: { "deans_list.$": 2022 } }, [], {
          activity_ids: 1,
          grades: 95,
          deans_list: 2021
        })
      ).toEqual(["deans_list"]);

      expect(input).toEqual({
        _id: 8,
        activity_ids: [1, 2],
        grades: [90, 95],
        deans_list: [2022, 2020]
      });
    });
  });

  describe.sequential("Positional Operators: More examples", () => {
    const input = [
      {
        _id: "SF",
        engineering: [
          { name: "Alice", email: "missingEmail", salary: 100000 },
          { name: "Bob", email: "missingEmail", salary: 75000 }
        ],
        sales: [
          {
            name: "Charlie",
            email: "charlie@mail.com",
            salary: 90000,
            bonus: 1000
          }
        ]
      },
      {
        _id: "NYC",
        engineering: [{ name: "Dave", email: "dave@mail.com", salary: 55000 }],
        sales: [
          { name: "Ed", email: "ed@mail.com", salary: 99000, bonus: 2000 },
          {
            name: "Fran",
            email: "fran@mail.com",
            salary: 50000,
            bonus: 10000
          }
        ]
      }
    ];

    it("Use the $ Operator to Update the First Match in an Array", () => {
      expect(
        update(
          input[0],
          { $set: { "engineering.$.email": "alice@mail.com" } },
          [],
          { "engineering.email": "missingEmail" }
        )
      ).toEqual(["engineering"]);

      expect(input[0]).toEqual({
        _id: "SF",
        engineering: [
          { name: "Alice", email: "alice@mail.com", salary: 100000 },
          { name: "Bob", email: "missingEmail", salary: 75000 }
        ],
        sales: [
          {
            name: "Charlie",
            email: "charlie@mail.com",
            salary: 90000,
            bonus: 1000
          }
        ]
      });

      expect(
        update(
          input[0],
          { $set: { "engineering.$.email": "bob@mail.com" } },
          [],
          {
            engineering: { $elemMatch: { name: "Bob", email: "missingEmail" } }
          }
        )
      ).toEqual(["engineering"]);

      expect(input[0]).toEqual({
        _id: "SF",
        engineering: [
          { name: "Alice", email: "alice@mail.com", salary: 100000 },
          { name: "Bob", email: "bob@mail.com", salary: 75000 }
        ],
        sales: [
          {
            name: "Charlie",
            email: "charlie@mail.com",
            salary: 90000,
            bonus: 1000
          }
        ]
      });
    });

    it("Use the $[] Operator to Update All Array Elements Within a Document", () => {
      expect(
        update(input[1], { $inc: { "sales.$[].bonus": 2000 } }, [], {
          _id: "NYC"
        })
      ).toEqual(["sales"]);

      expect(find(input, { _id: "NYC" }, { sales: 1, _id: 0 }).all()).toEqual([
        {
          sales: [
            { name: "Ed", email: "ed@mail.com", salary: 99000, bonus: 4000 },
            {
              name: "Fran",
              email: "fran@mail.com",
              salary: 50000,
              bonus: 12000
            }
          ]
        }
      ]);
    });

    it("Use the $[<identifier>] Operator to Update Elements that Match a Filter Condition", () => {
      input.forEach(o => {
        update(
          o,
          {
            $set: {
              "engineering.$[elemX].salary": 95000,
              "sales.$[elemY].salary": 75000
            }
          },
          [
            { "elemX.name": "Bob", "elemX.salary": 75000 },
            { "elemY.name": "Ed", "elemY.salary": 50000 }
          ]
        );
      });

      expect(
        find(
          input,
          { "engineering.name": "Bob" },
          { engineering: { $elemMatch: { name: "Bob" } }, _id: 0 }
        ).all()
      ).toEqual([
        {
          engineering: [{ name: "Bob", email: "bob@mail.com", salary: 95000 }]
        }
      ]);

      expect(
        find(
          input,
          { "sales.name": "Ed" },
          { sales: { $elemMatch: { name: "Ed" } }, _id: 0 }
        ).all()
      ).toEqual([
        {
          sales: [
            { name: "Ed", email: "ed@mail.com", salary: 99000, bonus: 4000 }
          ]
        }
      ]);
    });
  });
});
