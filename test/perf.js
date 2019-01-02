var test = require('tape')
var performance = require('perf_hooks').performance
var mingo = require('../dist/mingo')
var _ = require('lodash');

const items = _.range(10 * 1000).map(id => {
  return {
    id: id,
    name: `item ${id}`,
    active: true,
    books: _.range(10).map(bookId => {
      return {
        id: bookId,
        title: `book ${bookId}`
      };
    }),
    authors: _.range(10).map(authorId => {
      return {
        id: authorId,
        name: `author ${authorId}`
      };
    })
  };
});

test('Performance', function (t) {
  const time1 = performance.now();
  const metrics = mingo.aggregate(items, [
    {
      $match: {
        'active': true
      }
    },
    {
      $project: {
        'booksSize': {$size: '$books'},
        'authorsSize': {$size: '$authors'}
      }
    },
    {
      $group: {
        '_id': void 0,
        'maxBooksCount': {$max: '$booksSize'},
        'allBooksSum': {$sum: '$booksSize'},
        'avgBooksCount': {$avg: '$booksSize'},
        'maxAuthorsCount': {$max: '$authorsSize'},
        'allAuthorsSum': {$sum: '$authorsSize'},
        'avgAuthorsCount': {$avg: '$authorsSize'}
      }
    }
  ]);

  const time2 = performance.now()
  const elapsed = (time2 - time1)
  // allow 2sec because GC times are longer on less powerful hardware.
  t.assert(elapsed < 2000, `elapsed time ${elapsed}ms should be less than a 2sec`)
  t.end()
})