
export class Lazy {
  /**
   * @param {*} src Object(next:Function)|Array|Lazy
   * @param {Function} fn A transformation function
   */
  constructor (src, fn, opt) {
    this.__src = src
    this.__fn = fn || Lazy.identity
    this.__opt = opt || { reduce: false }
    this.__index = 0
    this.__done = false
  }

  static _isobject (o) {
    return !!o && o.constructor.name === 'Object'
  }

  static isDone (o) {
    return Lazy._isobject(o) && Object.keys(o).length === 1 && o.hasOwnProperty('done') && o.done
  }

  static isVal (o) {
    return Lazy._isobject(o) && Object.keys(o).length === 2 && o.hasOwnProperty('value') && o.hasOwnProperty('done')
  }

  static identity (o) {
    return o
  }

  static done () {
    return { done: true }
  }

  static isLazy (o) {
    return o instanceof Lazy
  }

  static isIterator (o) {
    return o instanceof Object && o.next instanceof Function
  }

  static all (iter) {
    let result = []
    while (true) {
      let o = iter.next()
      if (Lazy.isDone(o)) break
      if (Lazy.isVal(o)) result.push(o.value)
    }
    return result
  }

  _end() {
    this.__done = true
    this.__src = null
  }

  [Symbol.iterator] () {
    let self = this
    return {
      next () {
        return self.next()
      }
    }
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

      // transform value if it is valid
      if (Lazy.isVal(obj)) {
        obj = this.__fn(obj)
      }

      if (Lazy.isVal(obj)) break
      if (Lazy.isDone(obj)) this._end()
    }

    return obj
  }

  all () {
    let arr = Lazy.all(this)
    return this.__opt.reduce ? arr[0] : arr
  }

  each (f) {
    let xs = this.map(f)
    let o = xs.next()
    while (Lazy.isVal(o)) o = xs.next()
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
    if (n instanceof Function) {
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
    if (n instanceof Function) {
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

  reverse () {
    return new LazyTransform(this, xs => {
      xs.reverse()
      return xs
    })
  }

  sort (cmp) {
    return new LazyTransform(this, xs => {
      if (!!cmp) {
        xs.sort(cmp)
      } else {
        xs.sort()
      }
      return xs
    })
  }

  transform (f, opt) {
    return new LazyTransform(this, f, opt)
  }

  reduce (f, init) {
    return new LazyTransform(this, xs => {
      return xs.reduce(f, init)
    }, { reduce: true })
  }

  count () {
    return new LazyTransform(this, xs => xs.length, { reduce: true })
  }
}

/**
 * Transforms an entire sequence to another
 */
class LazyTransform extends Lazy {
  /**
   * @param {Lazy} src
   * @param {Function} fn: (Array) => Any. transform function
   */
  constructor (src, fn, opt) {
    super(src, fn, opt)
    this.__seq = undefined
  }

  next () {
    if (!this.__seq) {
      this.__seq = new Lazy(this.__fn(Lazy.all(this.__src)))
    }
    return this.__seq.next()
  }
}