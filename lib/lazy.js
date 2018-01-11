/**
 * Returns a lazy object
 * @param {*} source An iterable or generator eg. Object{next:Function} | Array | Function
 */
export function Lazy (source) {
  return new Iterator(source)
}

Lazy.isDone = function (o) {
  return !!o && o.done === true
}

Lazy.done = function () {
  return { done: true }
}

Lazy.value = function (o) {
  return { value: o, done: false }
}

Lazy.isIterator = function (o) {
  return o instanceof Object && isFunction(o.next)
}

/**
 * Returns a new `Lazy` from the transforming the entire input sequence
 * @param {*} xs Finite sequence source
 * @param {Function} f Function of (Array) => (Any). Accepts the entire input as an array to transform
 */
Lazy.transform = function (xs, f) {
  return Lazy(f(Lazy.all(xs)))
}

/**
 * Returns all values from a sequence as an Array.
 * @param {*} xs A finite iterator or sequence
 */
Lazy.all = function (xs) {
  if (!Lazy.isIterator(xs)) return xs

  let result = []
  while (true) {
    let o = xs.next()
    if (Lazy.isDone(o)) break
    result.push(o.value)
  }

  return result
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

  return Lazy({
    next () {
      if (step > 0 && start < end || step < 0 && start > end) {
        let val = Lazy.value(start)
        start += step
        return val
      }
      return Lazy.done()
    }
  })
}

// helpers
function compare (a,b) {
  return a < b ? -1 : (a > b ? 1 : 0)
}

function isFunction (f) {
  return f instanceof Function
}

// enum-like constants
const NEXT = function () {}
const DONE = function () {}

function arrayIterator (source, fn) {
  let index = -1
  let size = source.length

  return function () {
    if (index >= size) return { done: true }

    let o = source[++index]

    for (let i = 0, len = fn.length; i < len && index < size; i++) {
      o = fn[i](o)
      if (o === NEXT) {
        index++
        o = source[index]
        i = -1
      } else if (o === DONE) {
        size = 0
        break
      }
    }

    return index < size ? { value: o, done: false } : { done: true }
  }
}

function baseIterator (source, fn) {
  let done = false

  function markDone () {
    done = true
    return { done: true }
  }

  return function () {
    if (done) return markDone()

    while (true) {
      let o = source.next()

      if (Lazy.isDone(o)) return { done: true }

      o = o.value

      for (let i = 0, len = fn.length; i < len; i++) {
        o = fn[i](o)
        if (o === NEXT) break
        if (o === DONE) return markDone()
      }

      if (o !== NEXT) return { value: o, done: false }
    }
  }
}


class Iterator {
  /**
   * @param {*} src Any object as seed for Lazy
   * @param {Function} fn An optional transformation function
   */
  constructor (source) {
    this.__fn = [] // lazy function chain

    if (isFunction(source)) {
      source = { next: source }
    } else if (!Lazy.isIterator(source) && !(source instanceof Array)) {
      source = [source]
    }

    // get iterator
    let iterator = source instanceof Array ? arrayIterator : baseIterator

    // make next function
    this.next = iterator(source, this.__fn)
  }

  [Symbol.iterator] () {
    return this
  }

  _push (f) {
    this.__fn.push(f)
    return this
  }

  all () {
    return Lazy.all(this)
  }

  each (f) {
    while (true) {
      let o = this.next()
      if (Lazy.isDone(o)) break
      if (f(o.value) === false) return false
    }
    return true
  }

  map (f) {
    let i = 0
    return this._push(o => {
      return f(o, i++)
    })
  }

  filter (pred) {
    return this._push(o => {
      return pred(o) ? o : NEXT
    })
  }

  /**
   * Take values from the sequence
   * @param {Number|Function} pred A number or predicate
   */
  take (pred) {
    if (!isFunction(pred)) {
      let i = 0
      let n = pred
      pred = (o) => n > i++
    }

    return this._push(o => {
      return pred(o) ? o : DONE
    })
  }

  /**
   * Skips values in the sequence
   * @param {Number|Function} f Number or predicate function
   */
  skip (f) {
    if (!isFunction(f)) {
      let i = f // number
      f = (o) => i-- > 0
    }

    return this._push(o => {
      return f(o) ? NEXT : o
    })
  }

  /**
   * Returns a reduction
   * @param {*} f a reducing function
   * @param {*} init
   */
  reduce (f, init) {
    let o = this.next()
    let i = 0

    if (init === undefined && !Lazy.isDone(o)) {
      init = o.value
      o = this.next()
      i++
    }

    while (!Lazy.isDone(o)) {
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
    return Lazy.transform(this, xs => {
      xs.reverse()
      return xs
    })
  }

  sort (cmp) {
    return Lazy.transform(this, xs => {
      cmp = cmp || compare
      xs.sort(cmp)
      return xs
    })
  }

  sortBy (f, cmp) {
    return Lazy.transform(this, xs => {
      cmp = cmp || compare
      xs.sort((a,b) => {
        return cmp(f(a), f(b))
      })
      return xs
    })
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