var Lazy = require('../dist/mingo').Lazy
var test = require('tape')

test('Lazy tests', function (t) {

  var DATA = [1,2,3,4,5,6,7,8,9]

  function newLazy() {
    return new Lazy(DATA)
  }

  var fixtures = [
    [ newLazy().map(n => n*3), [3, 6, 9, 12, 15, 18, 21, 24, 27], "can map" ],
    [ newLazy().filter(n => n % 2 == 0), [2,4,6,8], "can filter" ],
    [ newLazy().skip(3), [4,5,6,7,8,9], "can skip with number" ],
    [ newLazy().take(3), [1,2,3], "can take with number"],
    [ newLazy().skip(n => n < 5), [5,6,7,8,9], "can skip with predicate" ],
    [ newLazy().take(n => n < 5), [1,2,3,4], "can take with predicate"],
    [ newLazy().reverse().take(3), [9,8,7], "can reverse" ],
    [ newLazy().reverse().take(3).sort(), [7,8,9], "can sort" ],
    [ newLazy().reverse().take(3).sortBy(n => n % 3), [9,7,8], "can sortBy" ],
    [ newLazy().reduce((acc,n) => acc+n), [45], "can reduce" ],
    [ Lazy.range(1,10), DATA, "can range from start to end" ],
    [ Lazy.range(5), [0,1,2,3,4], "can range with only end value" ],
    [ Lazy.range(0, 10, 2), [0,2,4,6,8], "can range with increment" ],
    [ Lazy.range(10, 5, -2), [10,8,6], "can range with decrement" ],
    [ Lazy.range(0, Infinity, -2), [], "can detect invalid range with decrement" ],
    [ Lazy.range(Infinity, 0, 5), [], "can detect invalid range with increment" ]
  ]

  fixtures.forEach(n => {
    t.deepEqual(n[0].all(), n[1], n[2])
  })

  var arr = []
  newLazy().each(o => arr.push(o%2))
  t.deepEqual(arr, [1,0,1,0,1,0,1,0,1], "can iterate with each")

  var sample = new Lazy(DATA).sample().all()
  t.ok(sample.length > 0, "sample must be non-zero")
  t.ok(sample.length < DATA.length, "sample must be less than DATA length")
  t.deepEqual(newLazy().count(), DATA.length, "can count sequence")

  t.end()
})


// command: for i in `seq 3`; do time tape test/**/*.js >/dev/null; done

// Current: master
// tape test/**/*.js > /dev/null  3.61s user 0.13s system 100% cpu 3.733 total
// tape test/**/*.js > /dev/null  3.45s user 0.11s system 102% cpu 3.487 total
// tape test/**/*.js > /dev/null  3.44s user 0.11s system 102% cpu 3.461 total

// Lazy: (ae497acb0fae6ec92546d9339f10d8e7a6dacd1a)
// tape test/**/*.js > /dev/null  2.58s user 0.11s system 103% cpu 2.605 total
// tape test/**/*.js > /dev/null  2.54s user 0.10s system 103% cpu 2.557 total
// tape test/**/*.js > /dev/null  2.55s user 0.10s system 103% cpu 2.562 total

// Lazy: (latest)
// tape test/**/*.js > /dev/null  1.54s user 0.08s system 113% cpu 1.423 total
// tape test/**/*.js > /dev/null  1.52s user 0.08s system 113% cpu 1.411 total
// tape test/**/*.js > /dev/null  1.47s user 0.07s system 111% cpu 1.382 total