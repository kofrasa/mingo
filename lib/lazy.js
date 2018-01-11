
export function Lazy (source) {
  return new Iterator(source)
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
Lazy.DONE = function () {}

// function arrayIterator (array) {
//   return (data => {
//     let size = data.length
//     let index = 0
//     return {
//       getIndex () { return index },
//       moveNext () { index++ },
//       current () {
//         return index < size
//           ? { value: data[index], done: false}
//           : { done: true }
//       },
//       update (val, i) { data[i] = val }
//     }
//   })(array)
// }

class Iterator {
  /**
   * @param {*} src Any object as seed for Lazy
   * @param {Function} fn An optional transformation function
   */
  constructor (source) {
    this.__fn = [] // lazy function chain
    this.__done = false
    this.__src = source

    if (Lazy._isfunction(source)) {
      this.__src = { next: source }
    } else if (!Lazy.isIterator(source) && !(source instanceof Array)) {
      source = [source]
    }

    if (source instanceof Array) {

      let index = -1
      let data = source
      let size = source.length

      this.next = function () {
        if (this.__done || index >= size) return Lazy.done()

        let o = data[++index]

        for (let i = 0, len = this.__fn.length; i < len && index < size; i++) {
          o = this.__fn[i](o)
          if (o === Lazy.NEXT) {
            index++
            o = data[index]
            i = -1
          } else if (o === Lazy.DONE) {
            return this._end()
          }
        }

        return index < size ? { value: o, done: false } : { done: true }
      }

    } else {

      this.next = function () {

        let o = Lazy.DONE

        while (!this.__done) {
          o = this.__src.next()

          if (Lazy.isDone(o)) return this._end()
          o = o.value

          for (let i = 0, len = this.__fn.length; i < len; i++) {
            o = this.__fn[i](o)
            if (o === Lazy.NEXT) break
            if (o === Lazy.DONE) return this._end()
          }

          if (o !== Lazy.NEXT) break
        }

        return o === Lazy.DONE ? { done: true } : { value: o, done: false }
      }
    }
  }

  [Symbol.iterator] () {
    return this
  }

  _push (f) {
    this.__fn.push(f)
    return this
  }

  _end () {
    this.__done = true
    return { done: true }
  }

  all () {
    return Lazy.all(this)
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
    return this._push(o => {
      return f(o, i++)
    })
  }

  filter (pred) {
    return this._push(o => {
      return pred(o) ? o : Lazy.NEXT
    })
  }

  /**
   * Take values from the sequence
   * @param {Number|Function} pred A number or predicate
   */
  take (pred) {
    if (!Lazy._isfunction(pred)) {
      let i = 0
      let n = pred
      pred = (o) => n > i++
    }

    return this._push(o => {
      return pred(o) ? o : Lazy.DONE
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

    return this._push(o => {
      return f(o) ? Lazy.NEXT : o
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