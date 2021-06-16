import { AnyVal, Callback, Predicate, RawArray, RawObject } from "./types";

interface Iteratee {
  action: Action;
  func?: Callback<AnyVal>;
  count?: number;
}

/**
 * A value produced by a generator
 */
interface IteratorResult {
  readonly value?: AnyVal;
  readonly done: boolean;
}

/**
 * Simplified generator interface
 */
interface Generator<T> {
  next: () => T;
}

export type Source =
  | Generator<IteratorResult>
  | Callback<IteratorResult>
  | RawArray;

/**
 * Returns an iterator
 * @param {*} source An iterable source (Array, Function, Generator, or Iterator)
 */
export function Lazy(source: Source): Iterator {
  return source instanceof Iterator ? source : new Iterator(source);
}

/**
 * Checks whether the given object is compatible with a generator i.e Object{next:Function}
 * @param {*} o An object
 */
function isGenerator(o: AnyVal) {
  return (
    !!o && typeof o === "object" && (o as RawObject)?.next instanceof Function
  );
}

function dropItem(array: AnyVal[], i: number) {
  const rest = array.slice(i + 1);
  array.splice(i);
  Array.prototype.push.apply(array, rest);
}

// stop iteration error
const DONE = new Error();

// Lazy function actions
enum Action {
  MAP,
  FILTER,
  TAKE,
  DROP,
}

function createCallback(
  nextFn: Callback<AnyVal>,
  iteratees: Iteratee[],
  buffer: RawArray
): Callback<IteratorResult> {
  let done = false;
  let index = -1;
  let bufferIndex = 0; // index for the buffer

  return function (storeResult?: boolean): IteratorResult {
    // special hack to collect all values into buffer
    try {
      outer: while (!done) {
        let o = nextFn();
        index++;

        let i = -1;
        const size = iteratees.length;
        let innerDone = false;

        while (++i < size) {
          const r = iteratees[i];

          switch (r.action) {
            case Action.MAP:
              o = r.func(o, index);
              break;
            case Action.FILTER:
              if (!r.func(o, index)) continue outer;
              break;
            case Action.TAKE:
              --r.count;
              if (!r.count) innerDone = true;
              break;
            case Action.DROP:
              --r.count;
              if (!r.count) dropItem(iteratees, i);
              continue outer;
            default:
              break outer;
          }
        }

        done = innerDone;

        if (storeResult) {
          buffer[bufferIndex++] = o;
        } else {
          return { value: o, done: false };
        }
      }
    } catch (e) {
      if (e !== DONE) throw e;
    }

    done = true;
    return { done };
  };
}

/**
 * A lazy collection iterator yields a single value at time upon request
 */
export class Iterator {
  private __iteratees: Iteratee[]; // lazy function chain
  private __first: boolean; // flag whether to return a single value
  private __done: boolean;
  private __buf: AnyVal[];
  private __next: Callback<IteratorResult>;

  /**
   * @param {*} source An iterable object or function.
   *    Array - return one element per cycle
   *    Object{next:Function} - call next() for the next value (this also handles generator functions)
   *    Function - call to return the next value
   * @param {Function} fn An optional transformation function
   */
  constructor(source: Source) {
    this.__iteratees = []; // lazy function chain
    this.__first = false; // flag whether to return a single value
    this.__done = false;
    this.__buf = [];

    let nextVal: Callback<AnyVal>;

    if (source instanceof Function) {
      // make iterable
      source = { next: source };
    }

    if (isGenerator(source)) {
      const src = source as Generator<AnyVal>;
      nextVal = () => {
        const o = src.next() as RawObject;
        if (o.done) throw DONE;
        return o.value;
      };
    } else if (source instanceof Array) {
      const data = source;
      const size = data.length;
      let index = 0;
      nextVal = () => {
        if (index < size) return data[index++];
        throw DONE;
      };
    } else if (!(source instanceof Function)) {
      throw new Error(
        `Source is of type '${typeof source}'. Must be Array, Function, or Generator`
      );
    }

    // create next function
    this.__next = createCallback(nextVal, this.__iteratees, this.__buf);
  }

  private _validate() {
    if (this.__first)
      throw new Error("Cannot add iteratee/transform after `first()`");
  }

  /**
   * Add an iteratee to this lazy sequence
   * @param {Object} iteratee
   */
  private _push(action: Action, value: AnyVal) {
    this._validate();
    if (typeof value === "function") {
      this.__iteratees.push({ action, func: value as Callback<AnyVal> });
    } else if (typeof value === "number") {
      this.__iteratees.push({ action, count: value });
    } else {
      throw Error("invalid value");
    }
    return this;
  }

  next(): IteratorResult {
    return this.__next();
  }

  // Iteratees methods

  /**
   * Transform each item in the sequence to a new value
   * @param {Function} f
   */
  map(f: Callback<AnyVal>): Iterator {
    return this._push(Action.MAP, f);
  }

  /**
   * Select only items matching the given predicate
   * @param {Function} pred
   */
  filter(predicate: Predicate<AnyVal>): Iterator {
    return this._push(Action.FILTER, predicate);
  }

  /**
   * Take given numbe for values from sequence
   * @param {Number} n A number greater than 0
   */
  take(n: number): Iterator {
    return n > 0 ? this._push(Action.TAKE, n) : this;
  }

  /**
   * Drop a number of values from the sequence
   * @param {Number} n Number of items to drop greater than 0
   */
  drop(n: number): Iterator {
    return n > 0 ? this._push(Action.DROP, n) : this;
  }

  // Transformations

  /**
   * Returns a new lazy object with results of the transformation
   * The entire sequence is realized.
   *
   * @param {Function} fn Tranform function of type (Array) => (Any)
   */
  transform(fn: Callback<Source>): Iterator {
    this._validate();
    const self = this;
    let iter: Iterator;
    return Lazy(() => {
      if (!iter) {
        iter = Lazy(fn(self.value()));
      }
      return iter.next();
    });
  }

  /**
   * Mark this lazy object to return only the first result on `lazy.value()`.
   * No more iteratees or transformations can be added after this method is called.
   */
  first(): Iterator {
    this.take(1);
    this.__first = true;
    return this;
  }

  // Terminal methods

  /**
   * Returns the fully realized values of the iterators.
   * The return value will be an array unless `lazy.first()` was used.
   * The realized values are cached for subsequent calls
   */
  value(): AnyVal {
    if (!this.__done) {
      this.__done = this.__next(true).done;
    }
    return this.__first ? this.__buf[0] : this.__buf;
  }

  /**
   * Execute the funcion for each value. Will stop when an execution returns false.
   * @param {Function} f
   * @returns {Boolean} false iff `f` return false for AnyVal execution, otherwise true
   */
  each(f: Callback<AnyVal>): boolean {
    for (;;) {
      const o = this.next();
      if (o.done) break;
      if (f(o.value) === false) return false;
    }
    return true;
  }

  /**
   * Returns the reduction of sequence according the reducing function
   *
   * @param {*} f a reducing function
   * @param {*} init
   */
  reduce<T>(f: Callback<T>, initialValue: T): T {
    let o = this.next();
    let i = 0;

    if (initialValue === undefined && !o.done) {
      initialValue = o.value as T;
      o = this.next();
      i++;
    }

    while (!o.done) {
      initialValue = f(initialValue, o.value, i++);
      o = this.next();
    }

    return initialValue;
  }

  /**
   * Returns the number of matched items in the sequence
   */
  size(): number {
    return this.reduce((acc: number, _: number) => ++acc, 0);
  }
}

if (typeof Symbol === "function") {
  Iterator.prototype[Symbol.iterator] = function () {
    /* eslint-disable @typescript-eslint/no-unsafe-return */
    return this;
  };
}
