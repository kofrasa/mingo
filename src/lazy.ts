import { Callback, Predicate } from './util'

interface Iteratee {
  action: Action
  value: any
}

/**
 * Simplified generator interface
 */
interface Generator<T> {
  next: Callback<T>
}

/**
 * A value produced by a generator
 */
interface Value {
  value?: any
  done: boolean
}

export type Source = Generator<any> | Callback<any> | Array<any>

/**
 * Returns an iterator
 * @param {*} source An iterable source (Array, Function, Generator, or Iterator)
 */
export function Lazy(source: Source): Iterator {
  return (source instanceof Iterator) ? source : new Iterator(source)
}

/**
 * Checks whether the given object is compatible with a generator i.e Object{next:Function}
 * @param {*} o An object
 */
function isGenerator(o: any) {
  return !!o && typeof o === 'object' && o.next instanceof Function
}

function dropItem(array: any[], i: number) {
  let rest = array.slice(i + 1)
  array.splice(i)
  Array.prototype.push.apply(array, rest)
}

// stop iteration error
const DONE = new Error()

// Lazy function actions
enum Action {
  MAP,
  FILTER,
  TAKE,
  DROP
}

function createCallback(nextFn: Callback<any>, iteratees: Iteratee[], buffer: any[]): Callback<Value> {

  let done = false
  let index = -1
  let bufferIndex = 0 // index for the buffer

  return function (storeResult?: boolean): Value {

    // special hack to collect all values into buffer
    try {

      outer: while (!done) {
        let o = nextFn()
        index++

        let i = -1
        let size = iteratees.length
        let innerDone = false

        while (++i < size) {
          let r = iteratees[i]

          switch (r.action) {
            case Action.MAP:
              o = r.value(o, index)
              break
            case Action.FILTER:
              if (!r.value(o, index)) continue outer
              break
            case Action.TAKE:
              --r.value
              if (!r.value) innerDone = true
              break
            case Action.DROP:
              --r.value
              if (!r.value) dropItem(iteratees, i)
              continue outer
            default:
              break outer
          }
        }

        done = innerDone

        if (storeResult) {
          buffer[bufferIndex++] = o
        } else {
          return { value: o, done: false }
        }
      }
    } catch (e) {
      if (e !== DONE) throw e
    }

    done = true
    return { done }
  }
}

export class Iterator {

  private __iteratees: Iteratee[] // lazy function chain
  private __first: boolean // flag whether to return a single value
  private __done: boolean
  private __buf: any[]
  private __next: Callback<Value>

  /**
   * @param {*} source An iterable object or function.
   *    Array - return one element per cycle
   *    Object{next:Function} - call next() for the next value (this also handles generator functions)
   *    Function - call to return the next value
   * @param {Function} fn An optional transformation function
   */
  constructor(source: Source) {
    this.__iteratees = [] // lazy function chain
    this.__first = false // flag whether to return a single value
    this.__done = false
    this.__buf = []

    let nextVal: Callback<any>

    if (source instanceof Function) {
      // make iterable
      source = { next: source }
    }

    if (isGenerator(source)) {
      const src = source as Generator<any>
      nextVal = () => {
        let o = src.next()
        if (o.done) throw DONE
        return o.value
      }
    } else if (source instanceof Array) {
      const data = source
      const size = data.length
      let index = 0
      nextVal = () => {
        if (index < size) return data[index++]
        throw DONE
      }
    } else if (!(source instanceof Function)) {
      console.log(source)
      throw new Error("Source is not iterable. Must be Array, Function, or Generator")
    }

    // create next function
    this.__next = createCallback(nextVal, this.__iteratees, this.__buf)
  }

  private _validate() {
    if (this.__first) throw new Error("Cannot add iteratee/transform after `first()`")
  }

  /**
   * Add an iteratee to this lazy sequence
   * @param {Object} iteratee
   */
  private _push(action: Action, value: any) {
    this._validate()
    this.__iteratees.push({ action, value })
    return this
  }

  next(): Value {
    return this.__next()
  }

  // Iteratees methods

  /**
   * Transform each item in the sequence to a new value
   * @param {Function} f
   */
  map(f: Callback<any>): Iterator {
    return this._push(Action.MAP, f)
  }

  /**
   * Select only items matching the given predicate
   * @param {Function} pred
   */
  filter(predicate: Predicate<any>): Iterator {
    return this._push(Action.FILTER, predicate)
  }

  /**
   * Take given numbe for values from sequence
   * @param {Number} n A number greater than 0
   */
  take(n: number): Iterator {
    return n > 0 ? this._push(Action.TAKE, n) : this
  }

  /**
   * Drop a number of values from the sequence
   * @param {Number} n Number of items to drop greater than 0
   */
  drop(n: number): Iterator {
    return n > 0 ? this._push(Action.DROP, n) : this
  }

  // Transformations

  /**
   * Returns a new lazy object with results of the transformation
   * The entire sequence is realized.
   *
   * @param {Function} fn Tranform function of type (Array) => (Any)
   */
  transform(fn: Callback<any>): Iterator {
    this._validate()
    let self = this
    let iter: Iterator
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
  first(): Iterator {
    this.take(1)
    this.__first = true
    return this
  }

  // Terminal methods

  /**
   * Returns the fully realized values of the iterators.
   * The return value will be an array unless `lazy.first()` was used.
   * The realized values are cached for subsequent calls
   */
  value(): any {
    if (!this.__done) {
      this.__done = this.__next(true).done
    }
    return this.__first ? this.__buf[0] : this.__buf
  }

  /**
   * Execute the funcion for each value. Will stop when an execution returns false.
   * @param {Function} f
   * @returns {Boolean} false iff `f` return false for any execution, otherwise true
   */
  each(f: Callback<any>): boolean {
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
  reduce(f: Callback<any>, initialValue: any): any {

    let o = this.next()
    let i = 0

    if (initialValue === undefined && !o.done) {
      initialValue = o.value
      o = this.next()
      i++
    }

    while (!o.done) {
      initialValue = f(initialValue, o.value, i++)
      o = this.next()
    }

    return initialValue
  }

  /**
   * Returns the number of matched items in the sequence
   */
  size(): number {
    return this.reduce((acc: number, n: number) => ++acc, 0)
  }
}

if (typeof Symbol === 'function') {
  Iterator.prototype[Symbol.iterator] = function () {
    return this
  }
}