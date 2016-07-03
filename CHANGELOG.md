Changelog
=========

Changes starting from v0.5.0 are tracked here

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
