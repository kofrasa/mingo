Changelog
=========
## 2.2.2 / 2018-04-17
- Support `$unwind` for arrays nested in objects. Fixes [#80](https://github.com/kofrasa/mingo/issues/80)

## 2.2.1 / 2018-04-14
- Added `$expr` operator. Fixes [#79](https://github.com/kofrasa/mingo/issues/79)

## 2.2.0 / 2018-01-25
- More Performance improvements for lazy evaluation
- Added `$mergeObjects` operator
- Change `Lazy` to factory
- Remove `Lazy` static methods except `isIterator`

## 2.1.1 / 2017-12-18
- Use iterator input for Query
- Don't sort cursor modifiers

## 2.1.0 / 2017-12-17
- Added new `Lazy` iterator to re-implement `Cursor` and pipeline operators
- Added `Aggregator.stream` to obtain iterator for stream pipeline results
- Removed `Cursor` methods `first()` and `last()`

## 2.0.5 / 2017-12-11
- Add typescript declaration. Fixes [#75](https://github.com/kofrasa/mingo/pull/75)

## 2.0.4 / 2017-10-19
- Handle date values in `$add` operator. Fixes [#73](https://github.com/kofrasa/mingo/issues/73)

## 2.0.3 / 2017-09-25
- Fix `map` so it does not break `cloneDeep`
- Improve hash function

## 2.0.2 / 2017-09-14
- Remove array size constraint on `$concatArrays`. [#64](https://github.com/kofrasa/mingo/issues/64)
- Filter out empty values from collection. [#65](https://github.com/kofrasa/mingo/issues/65)
- Fix false positive tests and `$substrBytes`. [#66](https://github.com/kofrasa/mingo/issues/66)
- `$regex` should matched nested one level deep. [#70](https://github.com/kofrasa/mingo/issues/70)

## 2.0.1 / 2017-09-07
- Minimize cloning in pipeline operators
- Return new object for `$lookup` without mutating original. Fixes #59 and #60
- Make `clone` return shallow clone
- Provide `cloneDeep` for deep cloning

## 2.0.0 / 2017-08-12
- Removed custom polyfills
- Added `$strLenBytes`, `$strLenCP`, `$substrCP`, `$substrBytes`
- Fix `$indexOfBytes`
- Fix `$stdDevSamp`
- Fix `$in` for aggregation operations
- Removed max and min cursor methods.
- Restrict custom query operator type `OP_QUERY` to return boolean only
- Rename `OP_AGGREGATE` to `OP_EXPRESSION`
- Update `$unwind` to MongoDB 3.2 features

## 1.3.3 / 2017-08-02
- Fix `computeValue` not overriding group operator keys after resolving expression
- Added `$in`, `$objectToArray`, and `$arrayToObject` array aggregation operators

## 1.3.2 / 2017-07-28
- Restore `setup` function. https://github.com/kofrasa/mingo/issues/56

## 1.3.1 / 2017-07-24
- Replaced core-js because it bloats compiled library by 10K i.e. ~24%
- Fix #55

## 1.3.0 / 2017-07-23
- Support ES6 modules
- Fix matching null and missing values. https://github.com/kofrasa/mingo/issues/54
- Improve comparing user-defined types

## v1.2.0 / 2017-07-17
- Fix `$where` operator not executed last. https://github.com/kofrasa/mingo/pull/50
- Fix matching nested arrays. https://github.com/kofrasa/mingo/issues/51
- Added `$facet` and `$bucket` operators
- Added `$bucketAuto` operator without granularity support
- Added string keys for `$type` operator
- Added Cursor support for [ES2015 Iterator Protocol](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols)
- Sort null/undefined values to front of sorted result
- Revert to operator names with format `Mingo.OP_<name>`

## v1.1.2 / 2017-03-30
- Optimize `$lookup` implementation
- Avoid reversing original input to `$reverseArray`

## v1.1.1 / 2017-03-12
- Fix incorrect method call for ObjectProto
- Limit exposed util methods to type checking

## v1.1.0 / 2017-03-11
- Renamed `Mingo.OP_<name>` functions to `Mingo.KEY_<name>`
- Added pipeline stage operator (`$lookup`)

## v1.0.1 / 2017-03-01
- Updated polyfills to fix failing build on older node versions

## v1.0.0 / 2017-02-28
- Added array aggregation operators
  (`$arrayElemAt`,`$concatArrays`,`$filter`,`$indexOfArray`,`$isArray`,`$range`,`$reverseArray`,`$reduce`,`$slice`,`$zip`)
- Added string aggregation operators (`$indexOfBytes`,`$split`)
- Added arithmetic aggregation operators (`$ceil`,`$exp`,`$floor`,`$ln`,`$log`,`$log10`,`$pow`,`$sqrt`,`$trunc`)
- Added .editorconfig
- Pass utility functions to custom operator implementation
- Rename function to retrieve collection id to `idKey` in custom operators
- Moved support for query projection streaming to a new package [mingo-stream](https://github.com/kofrasa/mingo-stream)

## v0.9.1 / 2017-02-08
- Fix resolving system variables with subpaths. See [issue#41](https://github.com/kofrasa/mingo/issues/41)

## v0.9.0 / 2017-02-06
- Added support for system variables (`$$ROOT`,`$$CURRENT`)
- Implemented more pipeline operators (`$redact`,`$addFields`,`$sample`,`$sortByCount`,`$count`,`$replaceRoot`)
- Added `$switch` conditional operator
- Fixed `$ifNull` conditional operator
- Allow use of `$in` and `$nin` as aggregation comparison operators

## v0.8.1 / 2016-12-08
- Fix querying deeply nested nested arrays and object equality matching. See [issue#36](https://github.com/kofrasa/mingo/issues/36)

## v0.8.0 / 2016-09-26
- Make this library zero-dependent

## v0.7.0 / 2016-09-10
- Fix nested projections for objects and arrays. See [issue#25](https://github.com/kofrasa/mingo/issues/25)

## v0.6.5 / 2016-07-04
- Fix incorrect de-duping of Date types in $sort aggregate operator. See [issue#23](https://github.com/kofrasa/mingo/pull/23)

## v0.6.4 / 2016-05-19
- Support matching against user-defined types. See [issue#22](https://github.com/kofrasa/mingo/issues/22)

## v0.6.3 / 2015-12-27
- Fixed numeric aggregation over undefined values. See [issues#21](https://github.com/kofrasa/mingo/issues/21)

## v0.6.2 / 2015-11-17
- Fixed erroneous cloning of objects. See [issue#20](https://github.com/kofrasa/mingo/pull/20)

## v0.6.1 / 2015-09-20
- Fixed matching nested array fields without specifying index. See [issue#19](https://github.com/kofrasa/mingo/issues/19)
- Added `VERSION` global field

## v0.6.0 / 2015-05-28
- Added `$dateToString` aggregation operator

## v0.5.0 / 2015-04-29
- Added support for extending operators via `Mingo.addOperators`
- Added `bower.json`
- Fixed grouping documents by an object key
- Fixed exclusive select projection not returning correct fields
