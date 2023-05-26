import "../src/init/system";

import { performance } from "perf_hooks";

import { aggregate, Aggregator } from "../src";
import { initOptions } from "../src/core";
import { Callback, RawObject } from "../src/types";

/* eslint-disable no-console */

const items: Array<RawObject> = [];
for (let i = 0; i < 100_000; i++) {
  const books: RawObject[] = [];
  const authors: RawObject[] = [];
  for (let j = 0; j < 10; j++) {
    books.push({
      id: j,
      title: `book ${j}`
    });
    authors.push({
      id: j,
      name: `author ${j}`
    });
  }
  items.push({
    _id: i,
    name: `item ${i}`,
    active: true,
    books,
    authors
  });
}
describe("perf", () => {
  describe("aggregation", () => {
    it("elapsed time should be less than a 30 seconds", () => {
      console.time("AGGREGATE_PERF");
      aggregate(items, [
        {
          $match: {
            active: true
          }
        },
        {
          $project: {
            booksSize: {
              $size: "$books"
            },
            authorsSize: {
              $size: "$authors"
            }
          }
        },
        {
          $group: {
            _id: void 0,
            maxBooksCount: {
              $max: "$booksSize"
            },
            allBooksSum: {
              $sum: "$booksSize"
            },
            avgBooksCount: {
              $avg: "$booksSize"
            },
            maxAuthorsCount: {
              $max: "$authorsSize"
            },
            allAuthorsSum: {
              $sum: "$authorsSize"
            },
            avgAuthorsCount: {
              $avg: "$authorsSize"
            }
          }
        }
      ]);
      console.timeEnd("AGGREGATE_PERF");
    });
  });

  describe("sorting", () => {
    function makeid(length: number) {
      const text: string[] = [];
      const possible =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      for (let i = 0; i < length; i++) {
        text.push(possible.charAt(Math.floor(Math.random() * possible.length)));
      }
      return text.join("");
    }

    const arrayToSort: string[] = [];
    for (let i = 0; i < 5000; i++) {
      arrayToSort.push(makeid(128));
    }

    const mingoSorter1 = new Aggregator(
      [
        {
          $sort: {
            number: 1
          }
        }
      ],
      initOptions({
        collation: {
          locale: "en",
          strength: 1
        }
      })
    );
    const mingoSorter2 = new Aggregator([
      {
        $sort: {
          number: 1
        }
      }
    ]);

    const MINGO_SORT = "MINGO SORT";
    const MINGO_SORT_LOCALE = "MINGO SORT WITH LOCALE";
    const NATIVE_SORT = "NATIVE SORT";
    const NATIVE_SORT_LOCALE = "NATIVE SORT WITH LOCALE";

    it("should complete in less than 1 sec", () => {
      const measure = (cb: Callback<void>): number => {
        const start = performance.now();
        cb();
        const end = performance.now();
        return end - start;
      };

      let ticks = measure(() => {
        console.time(MINGO_SORT_LOCALE);
        mingoSorter1.run(arrayToSort);
        console.timeEnd(MINGO_SORT_LOCALE);
      });
      expect(ticks).toBeLessThan(1000);

      ticks = measure(() => {
        console.time(MINGO_SORT);
        mingoSorter2.run(arrayToSort);
        console.timeEnd(MINGO_SORT);
      });
      expect(ticks).toBeLessThan(1000);

      const nativeSort = arrayToSort.concat();
      const nativeLocaleSort = arrayToSort.concat();

      console.time(NATIVE_SORT_LOCALE);
      nativeLocaleSort.sort((a: string, b: string) => {
        const r = a.localeCompare(b, "en", {
          sensitivity: "base"
        });
        if (r < 0) return -1;
        if (r > 0) return 1;
        return 0;
      });
      console.timeEnd(NATIVE_SORT_LOCALE);

      console.time(NATIVE_SORT);
      nativeSort.sort();
      console.timeEnd(NATIVE_SORT);
    });
  });
});

/* eslint-enable no-console */
