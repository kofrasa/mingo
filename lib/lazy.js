
const DONE = { done: true }
const ID_FUNC = (a) => a

export class Lazy {
  constructor (src, fn) {
    this.__src = src
    this.__fn = fn || ((a) => a)
    this.__index = 0
    this.__raw = undefined // fully realize lazy collection
    this.__done = false
  }

  static _isobject(o) {
    return !!o && o.constructor.name === 'Object'
  }

  static isDone (o) {
    return Lazy._isobject(o) && o.hasOwnProperty('done') && o.done
  }

  static isVal (o) {
    return Lazy._isobject(o) && o.hasOwnProperty('value') && o.hasOwnProperty('done')
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

    let obj = DONE

    while (!this.__done) {

      if (this.__src instanceof Lazy) {
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

      if (Lazy.isVal(obj)) return obj
      if (Lazy.isDone(obj)) this._end()
    }

    return obj
  }

  all () {
    if (!this.__done) {
      this.__raw = []
      while (true) {
        let obj = this.next()
        if (Lazy.isVal(obj)) {
          this.__raw.push(obj.value)
        } else {
          // no value means we are done
          this._end()
          break
        }
      }
    }
    return this.__raw
  }

  each (f) {
    return new Lazy(this, obj => {
      f(obj.value) // no return
    })
  }

  map (f) {
    return new Lazy(this, obj => {
      obj.value = f(obj.value)
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
        return n(obj.value) ? obj : DONE
      })
    } else {
      let i = 0
      return new Lazy(this, obj => {
        return n > i++ ? obj : DONE
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

  transform (f) {
    return new LazyTransform(this, f)
  }

  value (f) {
    f = f || ((x) => x)
    return new LazyVal(this, xs => f(xs))
  }

  reduce (f, init) {
    return new LazyVal(this, xs => {
      return xs.reduce(f, init)
    })
  }

  count () {
    return new LazyVal(this, xs => xs.length)
  }
}

/**
 * Transforms an entire sequence to another
 */
class LazyTransform extends Lazy {
  /**
   * @param {Lazy} src
   * @param {Function} fn: (Array) => Array. A transform function
   */
  constructor (src, fn) {
    super(src, fn)
    this.__seq = undefined
  }

  next () {
    if (!this.__seq) {
      this.__seq = new Lazy(this.__fn(this.__src.all()))
    }
    return this.__seq.next()
  }
}

/**
 * Transforms a sequence to yield a single value
 */
class LazyVal extends Lazy {
  /**
   * @param {Lazy} src
   * @param {Function} fn: (Array) => Any
   */
  constructor (src, fn) {
    super(src, fn)
  }

  next () {
    if (this.__done) return DONE
    let obj = { value: this.__fn(this.__src.all()), done: false }
    this._end()
    return obj
  }

  all () {
    return super.all()[0]
  }
}