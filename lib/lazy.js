/**
 * A lazy sequence for iterable sources
 *
 * Terms
 *  - Lazy:     An object of this class. Supports high order functions such as; map, filter, etc
 *  - Iterator: Any object with the interface Object{next:Function}. Lazy class is an iterator by default
 *  - Sequence: An Array or Iterator
 */
export class Lazy {
  /**
   * @param {*} src Any object as seed for Lazy
   * @param {Function} fn An optional transformation function
   */
  constructor (src, fn) {
    this.__src = src
    this.__fn = fn
    this.__index = 0
    this.__done = false
  }

  static _cmp (a,b) {
    return a < b ? -1 : (a > b ? 1 : 0)
  }

  static _isobject (o) {
    return !!o && o.constructor.name === 'Object'
  }

  static _isfunction (f) {
    return f instanceof Function
  }

  static _has (o,k) {
    return o.hasOwnProperty(k)
  }

  static isDone (o) {
    return Lazy._isobject(o) && Object.keys(o).length === 1 && Lazy._has(o, 'done') && o.done
  }

  static isVal (o) {
    return Lazy._isobject(o) && Object.keys(o).length === 2 && Lazy._has(o, 'value') && Lazy._has(o, 'done')
  }

  static done () {
    return { done: true }
  }

  static isIterator (o) {
    return o instanceof Object && Lazy._isfunction(o.next)
  }

  static value (o) {
    return { value: o, done: false }
  }

  /**
   * Returns the given value as `Lazy` object
   * @param {*} val Input value or function that returns input value.
   */
  static _iter (val) {
    if (Lazy._isfunction(val)) {
      val = { next: val }
    }
    return new Lazy(val)
  }

  /**
   * Returns a new `Lazy` from the transforming the entire input sequence
   * @param {*} xs Finite sequence source
   * @param {Function} f Function of (Array) => (Any). Accepts the entire input as an array to transform
   */
  static transform (xs, f) {
    return Lazy._iter(f(Lazy.all(xs)))
  }

  /**
   * Returns all values from a sequence as an Array.
   * @param {*} xs A finite iterator or sequence
   */
  static all (xs) {
    if (xs instanceof Array) return xs
    if (!Lazy.isIterator(xs)) return [xs]

    let result = []
    while (true) {
      let o = xs.next()
      if (Lazy.isDone(o)) break
      if (Lazy.isVal(o)) result.push(o.value)
    }
    return result
  }

  /**
   * Return a lazy range
   * @param {Number} start
   * @param {Number} end
   * @param {Number} step
   */
  static range (start, end, step) {
    if (end === undefined) {
      end = start
      start = 0
    }
    if (!step) step = start < end ? 1 : -1

    return new Lazy({
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

  [Symbol.iterator] () {
    return this
  }

  _end() {
    this.__done = true
    this.__src = null
  }

  all () {
    return Lazy.all(this)
  }

  next () {

    let obj = Lazy.done()

    while (!this.__done) {
      if (Lazy.isIterator(this.__src)) {
        obj = this.__src.next()
      } else if (this.__src instanceof Array) {
        if (this.__index < this.__src.length) {
          obj = { value: this.__src[this.__index++], done: false }
        }
      } else {
        obj = { value: this.__src, done: false }
        this._end()
      }

      if (Lazy.isVal(obj)) {
        // transform value if we have function
        if (!!this.__fn) obj = this.__fn(obj)
        if (Lazy.isVal(obj)) break
      }
      if (Lazy.isDone(obj)) this._end()
    }

    return obj
  }

  each (f) {
    // iterate without storing values
    this.filter(x => {
      f(x)
    }).all()
  }

  map (f) {
    let i = 0
    return new Lazy(this, obj => {
      obj.value = f(obj.value, i++)
      return obj
    })
  }

  filter (pred) {
    return new Lazy(this, obj => {
      if (pred(obj.value)) return obj
    })
  }

  /**
   * Take values from the sequence
   * @param {Number|Function} n A number or predicate function
   */
  take (n) {
    if (Lazy._isfunction(n)) {
      return new Lazy(this, obj => {
        return n(obj.value) ? obj : Lazy.done()
      })
    } else {
      let i = 0
      return new Lazy(this, obj => {
        return n > i++ ? obj : Lazy.done()
      })
    }
  }

  /**
   * Skips values in the sequence
   * @param {Number|Function} n Number or predicate function
   */
  skip (n) {
    if (Lazy._isfunction(n)) {
      return new Lazy(this, obj => {
        return n(obj.value) ? null : obj
      })
    } else {
      let i = n
      return new Lazy(this, obj => {
        if (i == 0) {
          return obj
        } else {
          i--
        }
      })
    }
  }

  /**
   * Returns a reduction
   * @param {*} f a reducing function
   * @param {*} init
   */
  reduce (f, init) {
    let self = this

    return new Lazy._iter(() => {
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