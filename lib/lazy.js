
export class Lazy {
  constructor (src) {
    this.__src = src
    this.__index = 0
    this.__raw = undefined // fully realize lazy collection
    this.__resolved = false
  }

  static isDone (obj) {
    return !!obj && obj.hasOwnProperty('done') && obj.done
  }

  static isVal (obj) {
    return !!obj && obj.hasOwnProperty('value') && obj.hasOwnProperty('done')
  }

  next () {
    let obj = {}
    if (this.__src instanceof Array) {
      if (this.__index < this.__src.length) {
        obj.value = this.__src[this.__index++]
      }
      obj.done = this.__index >= this.__src.length
    } else if (this.__src instanceof Lazy) {
      obj = this.__src.next()
    } else {
      obj.value = this.__src
      obj.done = true
    }
    return obj
  }

  all () {
    if (!this.__resolved) {
      this.__raw = []
      this.__resolved = true
      while (true) {
        let obj = this.next()
        if (Lazy.isVal(obj)) this.__raw.push(obj.value)
        if (Lazy.isDone(obj)) break
      }
    }
    // return a shallow clone ???
    return this.__raw
  }

  map (f) {
    return new LazyFn(this, obj => {
      if (Lazy.isVal(obj)) {
        obj.value = f(obj.value)
      }
      return obj
    })
  }

  filter (pred) {
    return new LazyFn(this, obj => {
      return Lazy.isVal(obj) && pred(obj.value) ? obj : { done: obj.done }
    })
  }

  take (n) {
    {
      let i = 0
      return new LazyFn(this, obj => {
        return n > i++ ? obj : { done: true }
      })
    }
  }

  skip (n) {
    {
      let i = n
      return new LazyFn(this, obj => {
        if (i == 0) {
          return obj
        } else {
          i -= 1
          return false
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

class LazyFn extends Lazy {
  constructor (src, fn) {
    super(src)
    this.__fn = fn
  }

  next () {
    while (true) {
      let obj = this.__fn(super.next())
      if (Lazy.isVal(obj)) return obj
      if (Lazy.isDone(obj)) return { done: true }
    }
  }
}

/**
 * Transforms an entire sequence
 */
class LazyTransform extends Lazy {
  constructor (src, fn) {
    super(src)
    this.__fn = fn // transform function: (Array) => Array
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
 * Transforms a sequence to a single value
 */
class LazyVal extends Lazy {
  constructor (src, fn) {
    super(src)
    this.__fn = fn // transform function: (Array) => Any
  }

  next () {
    return { value: this.__fn(this.__src.all()), done: true }
  }

  all () {
    return super.all()[0]
  }
}