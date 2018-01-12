/**
 * Returns a lazy object
 * @param {*} source An iterable or generator eg. Object{next:Function} | Array | Function
 */
export function Lazy (source) {
  return (source instanceof Iterator) ? source : new Iterator(source)
}

Lazy.isIterator = function (o) {
  return !!o && typeof o === 'object' && isFn(o.next)
}

/**
 * Returns a Lazy sequence from the transforming the entire input sequence
 * @param {*} xs Finite sequence source
 * @param {Function} f Function of (Array) => (Any). Accepts the entire input as an array to transform
 */
Lazy.transform = function (transformFn, source) {
  return Lazy(((fn, src) => {
    let iter = false
    return () => {
      if (!iter) {
        iter = Lazy(fn(toArray(src)))
      }
      return iter.next()
    }
  })(transformFn, source))
}

/**
 * Return a lazy range
 * @param {Number} start
 * @param {Number} end
 * @param {Number} step
 */
Lazy.range = function (start, end, step) {
  if (end === undefined) {
    end = start
    start = 0
  }
  if (!step) step = start < end ? 1 : -1

  return Lazy(() => {
    if (step > 0 && start < end || step < 0 && start > end) {
      let val =  { value: start, done: false }
      start += step
      return val
    }
    return { done: true }
  })
}

// helpers
function compare (a,b) {
  return a < b ? -1 : (a > b ? 1 : 0)
}

function isFn (f) {
  return !!f && typeof f === 'function'
}

function toArray (xs) {
  if (!Lazy.isIterator(xs)) return xs

  let result = []
  let o = { done: false }

  while (!o.done) {
    o = xs.next()
    if (!o.done) result.push(o.value)
  }

  return result
}

// Lazy function type flags
const LAZY_MAP = 1
const LAZY_FILTER = 2
const LAZY_TAKE = 3
const LAZY_TAKE_WHILE = 4
const LAZY_SKIP = 5
const LAZY_SKIP_WHILE = 6

function baseIterator (nextFn, iteratees) {

  function dropMember (i) {
    let rest = iteratees.slice(i + 1)
    iteratees.splice(i)
    Array.prototype.push.apply(iteratees, rest)
  }

  let done = false
  let index = -1

  return function () {

    outer:
    while (!done) {
      let o = nextFn()

      if (o.done) break

      o = o.value
      ++index

      let mIndex = -1
      let mSize = iteratees.length
      let innerDone = false

      while (++mIndex < mSize) {
        let member = iteratees[mIndex],
          func = member.func,
          type = member.type;

        switch (type) {
          case LAZY_MAP:
            o = func(o, index)
            break
          case LAZY_FILTER:
            if (!func(o, index)) continue outer
            break
          case LAZY_TAKE:
            --member.func
            if (!member.func) innerDone = true
            break
          case LAZY_TAKE_WHILE:
            if (!func(o, index)) break outer
            break
          case LAZY_SKIP:
            --member.func
            if (!member.func) dropMember(mIndex)
            continue outer
          case LAZY_SKIP_WHILE:
            if (func(o, index)) continue outer
            dropMember(mIndex)
            --mSize // adjust size
            --mIndex
            break
          default:
            break outer
        }
      }

      done = innerDone
      // we have a value
      return { value: o, done: false }
    }

    done = true
    return { done: true }
  }
}

class Iterator {
  /**
   * @param {*} source An array, function or iterator with signature Object{next:Function}
   * @param {Function} fn An optional transformation function
   */
  constructor (source) {
    this.__iteratees = [] // lazy function chain

    if (Lazy.isIterator(source)) {
      source = (src => () => src.next())(source)
    } else  if (!isFn(source)) {
      if (!(source instanceof Array)) source = [source]

      source = ((data) => {
        let dataSize = data.length
        let dataIndex = -1
        return () => {
          return ++dataIndex < dataSize
            ? { value: data[dataIndex], done: false }
            : { done: true }
        }
      })(source)
    }

    // create next function
    this.next = baseIterator(source, this.__iteratees)
  }

  [Symbol.iterator] () {
    return this
  }

  _push (iteratee) {
    this.__iteratees.push(iteratee)
    return this
  }

  all () {
    return toArray(this)
  }

  each (f) {
    let o = { done: false }

    while (!o.done) {
      o = this.next()
      if (o.done) break
      if (f(o.value) === false) return false
    }

    return true
  }

  map (f) {
    return this._push({ type: LAZY_MAP, func: f })
  }

  filter (pred) {
    return this._push({ type: LAZY_FILTER, func: pred })
  }

  /**
   * Take values from the sequence
   * @param {Number|Function} pred A number or predicate
   */
  take (pred) {
    if (isFn(pred)) {
      return this._push({ type: LAZY_TAKE_WHILE, func: pred })
    }
    return pred > 0 ? this._push({ type: LAZY_TAKE, func: pred }) : this
  }

  /**
   * Skips values in the sequence
   * @param {Number|Function} pred Number or predicate function
   */
  skip (pred) {
    if (isFn(pred)) {
      return this._push({ type: LAZY_SKIP_WHILE, func: pred })
    }
    return pred > 0 ? this._push({ type: LAZY_SKIP, func: pred }) : this
  }

  /**
   * Returns a reduction
   * @param {*} f a reducing function
   * @param {*} init
   */
  reduce (f, init) {
    let o = this.next()
    let i = 0

    if (init === undefined && !o.done) {
      init = o.value
      o = this.next()
      i++
    }

    while (!o.done) {
      init = f(init, o.value, i++)
      o = this.next()
    }

    return init
  }

  sample (p) {
    p = p || 0.5
    return this.filter(n => Math.random() < p)
  }

  reverse () {
    return Lazy.transform(xs => {
      xs.reverse()
      return xs
    }, this)
  }

  sort (cmp) {
    return Lazy.transform(xs => {
      cmp = cmp || compare
      xs.sort(cmp)
      return xs
    }, this)
  }

  sortBy (f, cmp) {
    return Lazy.transform(xs => {
      cmp = cmp || compare
      xs.sort((a,b) => {
        return cmp(f(a), f(b))
      })
      return xs
    }, this)
  }

  count () {
    return this.reduce((acc,n) => ++acc)
  }

  /**
   * Returns an Iterator with an `all()` method which yields only the first value.
   * This is useful when `reduce` yields a single value which should be returned unwrapped in a call to `all()`
   */
  one () {
    let self = this
    return {
      next () { return self.next() },
      all () { return self.all()[0] }
    }
  }
}