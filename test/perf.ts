import "../src/init/system";

import { performance } from "perf_hooks";
import test from "tape";

import { aggregate, Aggregator } from "../src";
import { RawObject } from "../src/types";

const items: Array<RawObject> = [];
for (let i = 0; i < 100_000; i++) {
  const books = [];
  const authors = [];
  for (let j = 0; j < 10; j++) {
    books.push({
      id: j,
      title: `book ${j}`,
    });
    authors.push({
      id: j,
      name: `author ${j}`,
    });
  }
  items.push({
    _id: i,
    name: `item ${i}`,
    active: true,
    books,
    authors,
  });
}

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
    return text.join("");
  }

  const arrayToSort = [];
  for (let i = 0; i < 5000; i++) {
    arrayToSort.push(makeid(128));
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

  const MINGO_SORT = "MINGO SORT";
  const MINGO_SORT_LOCALE = "MINGO SORT WITH LOCALE";
  const NATIVE_SORT = "NATIVE SORT";
  const NATIVE_SORT_LOCALE = "NATIVE SORT WITH LOCALE";

  console.time(MINGO_SORT_LOCALE);
  mingoSorter1.run(arrayToSort);
  console.timeEnd(MINGO_SORT_LOCALE);

  console.time(MINGO_SORT);
  mingoSorter2.run(arrayToSort);
  console.timeEnd(MINGO_SORT);

  const nativeSort = arrayToSort.concat();
  const nativeLocaleSort = arrayToSort.concat();

  console.time(NATIVE_SORT_LOCALE);
  nativeLocaleSort.sort((a: string, b: string) => {
    const r = a.localeCompare(b, "en", {
      sensitivity: "base",
    });
    if (r < 0) return -1;
    if (r > 0) return 1;
    return 0;
  });
  console.timeEnd(NATIVE_SORT_LOCALE);

  console.time(NATIVE_SORT);
  nativeSort.sort();
  console.timeEnd(NATIVE_SORT);
  t.end();
});
