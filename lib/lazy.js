
export function Lazy (source, fn) {
  return new Iterator(source, fn)
}

Lazy._identity = function (o) {
  return o
}

Lazy._cmp = function (a,b) {
  return a < b ? -1 : (a > b ? 1 : 0)
}

Lazy._isfunction = function (f) {
  return f instanceof Function
}

Lazy.isDone = function (o) {
  return !!o && o.done === true
}

Lazy.isVal = function (o) {
  return !!o && o.done === false && o.hasOwnProperty('value')
}

Lazy.done = function () {
  return { done: true }
}

Lazy.isIterator = function (o) {
  return o instanceof Object && Lazy._isfunction(o.next)
}

Lazy.value = function (o) {
  return { value: o, done: false }
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
  if (xs instanceof Array) return xs
  if (!Lazy.isIterator(xs)) return [xs]

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

Lazy.NEXT = function () {}

function arrayIterator (array) {
  return (data => {
    let size = data.length
    let index = 0
    return {
      next () {
        return index < size
          ? { value: data[index++], done: false}
          : { done: true }
      }
    }
  })(array)
}

class Iterator {
  /**
   * @param {*} src Any object as seed for Lazy
   * @param {Function} fn An optional transformation function
   */
  constructor (source, fn) {
    this.__src = source
    this.__fn = fn
    this.__done = false

    if (Lazy._isfunction(source)) {
      this.__src = { next: source }
    } else if (!Lazy.isIterator(source) && !(source instanceof Array)) {
      source = [source]
    }

    if (source instanceof Array) {
      this.__src = arrayIterator(source)
    }
  }

  [Symbol.iterator] () {
    return this
  }

  _end () {
    this.__done = true
    this.__src = null
  }

  _source () {
    return this.__src
  }

  all () {
    return Lazy.all(this)
  }

  next () {

    while (!this.__done) {
      let o = this.__src.next()

      if (this.__fn && !Lazy.isDone(o)) o = this.__fn(o)
      if (o !== Lazy.NEXT) {
        if (Lazy.isDone(o)) {
          this._end()
        } else {
          return o
        }
      }
    }

    return Lazy.done()
  }

  each (f) {
    while (true) {
      let o = this.next()
      if (Lazy.isDone(o)) break
      f(o.value)
    }
  }

  map (f) {
    let i = 0
    return Lazy(this, o => {
      o.value = f(o.value, i++)
      return o
    })
  }

  filter (pred) {
    return Lazy(this, o => {
      return pred(o.value) ? o : Lazy.NEXT
    })
  }

  /**
   * Take values from the sequence
   * @param {Number|Function} f A number or predicate function
   */
  take (f) {
    if (!Lazy._isfunction(f)) {
      let i = 0
      let n = f // number
      f = (o) => n > i++
    }
    return Lazy(this, o => {
      return f(o.value) ? o : Lazy.done()
    })
  }

  /**
   * Skips values in the sequence
   * @param {Number|Function} f Number or predicate function
   */
  skip (f) {
    if (!Lazy._isfunction(f)) {
      let i = f // number
      f = (o) => i-- > 0
    }
    return Lazy(this, o => {
      return f(o.value) ? Lazy.NEXT : o
    })
  }

  /**
   * Returns a reduction
   * @param {*} f a reducing function
   * @param {*} init
   */
  reduce (f, init) {
    let self = this

    return Lazy(() => {
      let o = self.next()
      if (Lazy.isDone(o)) return o

      let i = 0
      while (Lazy.isVal(o)) {
        init = (i === 0 && init === undefined) ? o.value : f(init, o.value, i)
        o = self.next()
        i++
      }
      return Lazy.value(init)
    })
  }

  sample () {
    return this.filter(n => Math.random() > 0.5)
  }

  reverse () {
    return Lazy.transform(this, xs => {
      xs.reverse()
      return xs
    })
  }

  sort (cmp) {
    return Lazy.transform(this, xs => {
      cmp = cmp || Lazy._cmp
      xs.sort(cmp)
      return xs
    })
  }

  sortBy (f, cmp) {
    return Lazy.transform(this, xs => {
      cmp = cmp || Lazy._cmp
      xs.sort((a,b) => {
        return cmp(f(a), f(b))
      })
      return xs
    })
  }

  count () {
    return this.reduce((acc,n) => ++acc).all()[0]
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