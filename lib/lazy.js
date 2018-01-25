/**
 * Returns an iterator
 * @param {*} source An iterable source (Array, Function, Object{next:Function})
 */
export function Lazy (source) {
  return (source instanceof Iterator) ? source : new Iterator(source)
}

Lazy.isIterator = isIterator

/**
 * Checks whether the given object is compatible with iterator i.e Object{next:Function}
 * @param {*} o An object
 */
function isIterator (o) {
  return !!o && typeof o === 'object' && isFn(o.next)
}

function isFn (f) {
  return !!f && typeof f === 'function'
}

function dropItem (array, i) {
  let rest = array.slice(i + 1)
  array.splice(i)
  Array.prototype.push.apply(array, rest)
}

// stop iteration error
const DONE = new Error()

// Lazy function type flags
const LAZY_MAP = 1
const LAZY_FILTER = 2
const LAZY_TAKE = 3
const LAZY_DROP = 4

function baseIterator (nextFn, iteratees, buffer) {

  let done = false
  let index = -1
  let hashes = {} // used for LAZY_UNIQ
  let bIndex = 0 // index for the buffer

  return function (b) {

    // special hack to collect all values into buffer
    b = b === buffer

    try {

      outer: while (!done) {
        let o = nextFn()
        index++

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
            case LAZY_DROP:
              --member.func
              if (!member.func) dropItem(iteratees, mIndex)
              continue outer
            default:
              break outer
          }
        }

        done = innerDone

        if (b) {
          buffer[bIndex++] = o
        } else {
          return { value: o, done: false }
        }
      }
    } catch (e) {
      if (e !== DONE) throw e
    }

    hashes = null // clear the hash cache
    done = true
    return { done: true }
  }
}

class Iterator {
  /**
   * @param {*} source An iterable object or function.
   *    Array - return one element per cycle
   *    Object{next:Function} - call next() for the next value (this also handles generator functions)
   *    Function - call to return the next value
   * @param {Function} fn An optional transformation function
   */
  constructor (source) {
    this.__iteratees = [] // lazy function chain
    this.__first = false // flag whether to return a single value
    this.__done = false
    this.__buf = []

    if (isFn(source)) {
      // make iterable
      source = { next: source }
    }

    if (isIterator(source)) {
      source = (src => () => {
        let o = src.next()
        if (o.done) throw DONE
        return o.value
      })(source)
    } else if (Array.isArray(source)) {
      source = (data => {
        let size = data.length
        let index = 0
        return () => {
          if (index < size) return data[index++]
          throw DONE
        }
      })(source)
    } else if (!isFn(source)) {
      throw new Error("Source is not iterable. Must be Array, Function or Object{next:Function}")
    }

    // create next function
    this.next = baseIterator(source, this.__iteratees, this.__buf)
  }

  [Symbol.iterator] () {
    return this
  }

  _validate () {
    if (this.__first) throw new Error("Cannot add iteratee/transform after `first()`")
  }

  /**
   * Add an iteratee to this lazy sequence
   * @param {Object} iteratee
   */
  _push (iteratee) {
    this._validate()
    this.__iteratees.push(iteratee)
    return this
  }

  //// Iteratees methods //////

  /**
   * Transform each item in the sequence to a new value
   * @param {Function} f
   */
  map (f) {
    return this._push({ type: LAZY_MAP, func: f })
  }

  /**
   * Select only items matching the given predicate
   * @param {Function} pred
   */
  filter (pred) {
    return this._push({ type: LAZY_FILTER, func: pred })
  }

  /**
   * Take given numbe for values from sequence
   * @param {Number} n A number greater than 0
   */
  take (n) {
    return n > 0 ? this._push({ type: LAZY_TAKE, func: n }) : this
  }

  /**
   * Drop a number of values from the sequence
   * @param {Number} n Number of items to drop greater than 0
   */
  drop (n) {
    return n > 0 ? this._push({ type: LAZY_DROP, func: n }) : this
  }

  //////// Transformations ////////

  /**
   * Returns a new lazy object with results of the transformation
   * The entire sequence is realized.
   *
   * @param {Function} fn Tranform function of type (Array) => (Any)
   */
  transform (fn) {
    this._validate()
    let self = this
    let iter
    return Lazy(() => {
      if (!iter) {
        iter = Lazy(fn(self.value()))
      }
      return iter.next()
    })
  }

  /**
   * Mark this lazy object to return only the first result on `lazy.value()`.
   * No more iteratees or transformations can be added after this method is called.
   */
  first () {
    this.take(1)
    this.__first = true
    return this
  }

  ////////////////////////////////////////////////////////////////

  // Terminal methods

  /**
   * Returns the fully realized values of the iterators.
   * The return value will be an array unless `lazy.first()` was used.
   * The realized values are cached for subsequent calls
   */
  value () {
    if (!this.__done) {
      this.__done = this.next(this.__buf).done
    }
    return this.__first ? this.__buf[0] : this.__buf
  }

  /**
   * Execute the funcion for each value. Will stop when an execution returns false.
   * @param {Function} f
   * @returns {Boolean} false iff `f` return false for any execution, otherwise true
   */
  each (f) {
    while (1) {
      let o = this.next()
      if (o.done) break
      if (f(o.value) === false) return false
    }
    return true
  }

  /**
   * Returns the reduction of sequence according the reducing function
   *
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

  /**
   * Returns the number of matched items in the sequence
   */
  size () {
    return this.reduce((acc,n) => ++acc, 0)
  }
}
