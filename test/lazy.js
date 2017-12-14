var Lazy = require('../dist/mingo').Lazy
var test = require('tape')

test('Lazy tests', function (t) {

  function newLazy() {
    return new Lazy([1,2,3,4,5,6,7,8,9]).map(n => n*3)
  }

  var fixtures = [
    [ newLazy(), [3, 6, 9, 12, 15, 18, 21, 24, 27], "can map sequence" ],
    [ newLazy().filter(n => n % 2 == 0), [6, 12, 18, 24], "can filter sequence" ],
    [ newLazy().skip(3), [12, 15, 18, 21, 24, 27], "can skip with number" ],
    [ newLazy().take(3), [3, 6, 9], "can take with number"],
    [ newLazy().skip(n => n < 15), [15, 18, 21, 24, 27], "can skip with predicate" ],
    [ newLazy().take(n => n < 15), [3, 6, 9, 12], "can take with predicate"],
    [ newLazy().reverse().take(3), [27, 24, 21], "can reverse sequence" ],
    [ newLazy().reverse().take(3).sort(), [21, 24, 27], "can sort sequence" ],
    [ newLazy().count(), 9, "can count sequence" ],
    [ newLazy().map(n => n/3).reduce((acc,n,xs) => acc + n, 0), 45, "can reduce sequence" ],
  ]

  fixtures.forEach(n => {
    t.deepEqual(n[0].all(), n[1], n[2])
  })

  var arr = []
  newLazy().each(o => arr.push(o%2))
  t.deepEqual(arr, [1,0,1,0,1,0,1,0,1], "can iterate with each")

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