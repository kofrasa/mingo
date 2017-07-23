Changelog
=========

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
- Refactor some methods

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
