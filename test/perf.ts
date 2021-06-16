import _ from "lodash";
import { performance } from "perf_hooks";
import test from "tape";

import { aggregate, Aggregator } from "../src";
import { RawObject } from "../src/types";

const items: Array<RawObject> = _.range(10 * 1000).map((id: number) => {
  return {
    id: id,
    name: `item ${id}`,
    active: true,
    books: _.range(10).map((bookId: number) => {
      return {
        id: bookId,
        title: `book ${bookId}`,
      };
    }),
    authors: _.range(10).map((authorId: number) => {
      return {
        id: authorId,
        name: `author ${authorId}`,
      };
    }),
  };
});

test("Aggregation performance", (t) => {
  const time1 = performance.now();
  aggregate(items, [
    {
      $match: {
        active: true,
      },
    },
    {
      $project: {
        booksSize: {
          $size: "$books",
        },
        authorsSize: {
          $size: "$authors",
        },
      },
    },
    {
      $group: {
        _id: void 0,
        maxBooksCount: {
          $max: "$booksSize",
        },
        allBooksSum: {
          $sum: "$booksSize",
        },
        avgBooksCount: {
          $avg: "$booksSize",
        },
        maxAuthorsCount: {
          $max: "$authorsSize",
        },
        allAuthorsSum: {
          $sum: "$authorsSize",
        },
        avgAuthorsCount: {
          $avg: "$authorsSize",
        },
      },
    },
  ]);

  const time2 = performance.now();
  const elapsed = time2 - time1;

  // allow 3sec because GC times are longer on less powerful hardware.
  t.assert(
    elapsed < 3000,
    `elapsed time ${elapsed}ms should be less than a 3sec`
  );
  t.end();
});

test("Sorting performance", (t) => {
  function makeid(length: number) {
    const text = [];
    const possible =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < length; i++) {
      text.push(possible.charAt(Math.floor(Math.random() * possible.length)));
    }
    return text.join();
  }

  const arrayToSort = [];
  for (let i = 0; i < 5000; i++) {
    arrayToSort.push(makeid(20));
  }

  const mingoSorter1 = new Aggregator(
    [
      {
        $sort: {
          number: 1,
        },
      },
    ],
    {
      collation: {
        locale: "en",
        strength: 1,
      },
    }
  );
  const mingoSorter2 = new Aggregator([
    {
      $sort: {
        number: 1,
      },
    },
  ]);

  console.time("MINGO SORT WITH LOCALE");
  mingoSorter1.run(arrayToSort);
  console.timeEnd("MINGO SORT WITH LOCALE");

  console.time("MINGO SORT WITHOUT LOCALE");
  mingoSorter2.run(arrayToSort);
  console.timeEnd("MINGO SORT WITHOUT LOCALE");

  console.time("NATIVE SORT WITH LOCALE");
  arrayToSort.concat().sort((a: string, b: string) => {
    const r = a.localeCompare(b, "en", {
      sensitivity: "base",
    });
    if (r < 0) return -1;
    if (r > 0) return 1;
    return 0;
  });
  console.timeEnd("NATIVE SORT WITH LOCALE");

  console.time("NATIVE SORT WITHOUT LOCALE");
  arrayToSort.concat().sort();
  console.timeEnd("NATIVE SORT WITHOUT LOCALE");
  t.end();
});
