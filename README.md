# mingo

MongoDB query language for in-memory objects

![license](https://img.shields.io/github/license/kofrasa/mingo)
[![version](https://img.shields.io/npm/v/mingo)](https://www.npmjs.org/package/mingo)
[![build status](https://img.shields.io/travis/com/kofrasa/mingo)](http://travis-ci.com/kofrasa/mingo)
![issues](https://img.shields.io/github/issues/kofrasa/mingo)
[![codecov](https://img.shields.io/codecov/c/github/kofrasa/mingo)](https://codecov.io/gh/kofrasa/mingo)
[![quality: Javascript](https://img.shields.io/lgtm/grade/javascript/github/kofrasa/mingo)](https://lgtm.com/projects/g/kofrasa/mingo/context:javascript)
[![alerts](https://img.shields.io/lgtm/alerts/github/kofrasa/mingo)](https://lgtm.com/projects/g/kofrasa/mingo/alerts)
[![npm downloads](https://img.shields.io/npm/dm/mingo)](https://www.npmjs.org/package/mingo)

## Install

`$ npm install mingo`

## Features

- Supports Dot Notation for both _`<array>.<index>`_ and _`<document>.<field>`_ selectors
- Query and Projection Operators
  - [Array Operators](https://docs.mongodb.com/manual/reference/operator/query-array/)
  - [Bitwise Operators](https://docs.mongodb.com/manual/reference/operator/query-bitwise/)
  - [Comparisons Operators](https://docs.mongodb.com/manual/reference/operator/query-comparison/)
  - [Element Operators](https://docs.mongodb.com/manual/reference/operator/query-element/)
  - [Evaluation Operators](https://docs.mongodb.com/manual/reference/operator/query-evaluation/)
  - [Logical Operators](https://docs.mongodb.com/manual/reference/operator/query-logical/)
  - [Projection Operators](https://docs.mongodb.com/manual/reference/operator/projection/)
- Aggregation Framework Operators
  - [Pipeline Operators](https://docs.mongodb.com/manual/reference/operator/aggregation-pipeline/)
  - [Accumulator Operators](https://docs.mongodb.com/manual/reference/operator/aggregation#accumulators-group/)
  - [Expression Operators](https://docs.mongodb.com/manual/reference/operator/aggregation/#expression-operators)
    - [Arithmetic Operators](https://docs.mongodb.com/manual/reference/operator/aggregation/#arithmetic-expression-operators)
    - [Array Operators](https://docs.mongodb.com/manual/reference/operator/aggregation/#array-expression-operators/)
    - [Boolean Operators](https://docs.mongodb.com/manual/reference/operator/aggregation/#boolean-expression-operators/)
    - [Comparisons Operators](https://docs.mongodb.com/manual/reference/operator/aggregation/#comparison-expression-operators/)
    - [Conditional Operators](https://docs.mongodb.com/manual/reference/operator/aggregation/#conditional-expression-operators/)
    - [Custom Aggregation Operators](https://docs.mongodb.com/manual/reference/operator/aggregation/#custom-aggregation-expression-operators)
    - [Date Operators](https://docs.mongodb.com/manual/reference/operator/aggregation/#date-expression-operators/)
    - [Literal Operators](https://docs.mongodb.com/manual/reference/operator/aggregation/#literal-expression-operators/)
    - [Miscellaneous Operators](https://docs.mongodb.com/manual/reference/operator/aggregation/#miscellaneous-operators)
    - [Object Operators](https://docs.mongodb.com/manual/reference/operator/aggregation/#object-expression-operators)
    - [Set Operators](https://docs.mongodb.com/manual/reference/operator/aggregation/#set-expression-operators/)
    - [String Operators](https://docs.mongodb.com/manual/reference/operator/aggregation/#string-expression-operators)
    - [Trignometry Operators](https://docs.mongodb.com/manual/reference/operator/aggregation/#trigonometry-expression-operators)
    - [Type Operators](https://docs.mongodb.com/manual/reference/operator/aggregation/#type-expression-operators)
    - [Variable Operators](https://docs.mongodb.com/manual/reference/operator/aggregation/#variable-expression-operators)
- ~~Support for adding custom operators using `mingo.addOperators`~~ Replaced with `$where`, `$accumulator`, and `$function` operators.
- Match against user-defined types
- Support for aggregaion variables
  - [`$$ROOT`,`$$CURRENT`,`$$DESCEND`,`$$PRUNE`,`$$KEEP`,`$$REMOVE`](https://docs.mongodb.com/manual/reference/aggregation-variables/)
- ES6 module compatible
- Query filtering and aggregation streaming.

For documentation on using query operators see [mongodb](http://docs.mongodb.org/manual/reference/operator/query/)

Browse [package docs](http://kofrasa.net/mingo/) for modules.

## Usage

```js
// Use as es6 module
import mingo from "mingo";

// or vanilla nodeJS
const mingo = require("mingo");
```

### Default exports and operators

The default export of the main module only includes `Aggregator`, `Query`, `aggregate()`, `find()`, and `remove()`.

Only [Query and Projection](https://docs.mongodb.com/manual/reference/operator/query/) operators are loaded by default when using the main module.
This is done using the side-effect module `mingo/init/basic`, and also automatically includes pipeline operators `$project`, `$skip`, `$limit`, and `$sort`.

If your application uses most of the available operators or you do not care about bundle size, you can load all operators as shown below.

```js
// Note that doing this effectively imports the entire library into your bundle and unused operators cannot be tree shaked
import "mingo/init/system";
```

Or from the node CLI

```sh
node -r 'mingo/init/system' myscript.js
```

### Importing submodules

Submodule imports are supported for both ES6 and ES5.

The following two examples are equivalent.

#### ES6

This work natively in typescript since it knows how to load commonJS modules as ES6.
You may optionally install the [esm](https://www.npmjs.com/package/esm) module to use this syntax.

```js
import { $unwind } from "mingo/operators/pipeline";
```

#### ES5

Unlike the ES6 version, it is necessary to specify the operator module in the path to avoid loading any extras

```js
const $unwind = require("mingo/operators/pipeline/unwind").$unwind;
```

## Enabling Operators

To support tree-shaking, you may import and register specific operators that will be used in your application.

```js
import { useOperators, OperatorType } from "mingo/core";
import { $trunc } from "mingo/operators/expression";
import { $bucket } from "mingo/operators/pipeline";

useOperators(OperatorType.EXPRESSION, { $trunc, $floor });
useOperators(OperatorType.PIPELINE, { $bucket });
```

## Using query object to test objects

```js
import { Query } from "mingo";

// create a query with criteria
// find all grades for homework with score >= 50
let query = new Query({
  type: "homework",
  score: { $gte: 50 },
});

// test if an object matches query
query.test(doc);
```

## Searching and Filtering

```js
import { Query } from "mingo";

// input is either an Array or any iterable source (i.e Object{next:Function}) including ES6 generators.
let criteria = { score: { $gt: 10 } };

let query = new Query(criteria);

// filter collection with find()
let cursor = query.find(collection);

// alternatively use shorthand
// cursor = mingo.find(collection, criteria)

// sort, skip and limit by chaining
cursor.sort({ student_id: 1, score: -1 }).skip(100).limit(100);

// count matches. exhausts cursor
cursor.count();

// classic cursor iterator (old school)
while (cursor.hasNext()) {
  console.log(cursor.next());
}

// ES6 iterators (new cool)
for (let value of cursor) {
  console.log(value);
}

// all() to retrieve matched objects. exhausts cursor
cursor.all();
```

## Using $jsonSchema operator

To use the `$jsonSchema` operator, you must register your own `JsonSchemaValidator` in the options.
No default implementation is provided out of the box so users can use a library with their preferred schema format.

The example below uses [Ajv](https://www.npmjs.com/package/ajv) to implement schema validation.

```js
import { RawObject } from "mingo/types"
import { JsonSchemaValidator } from "mingo/core"
import Ajv, { Schema } from "ajv"

const jsonSchemaValidator: JsonSchemaValidator = (s: RawObject) => {
  const ajv = new Ajv();
  const v = ajv.compile(s as Schema);
  return (o: RawObject) => (v(o) ? true : false);
};

const schema = {
  type: "object",
  required: ["item", "qty", "instock"],
  properties: {
    item: { type: "string" },
    qty: { type: "integer" },
    size: {
      type: "object",
      required: ["uom"],
      properties: {
        uom: { type: "string" },
        h: { type: "number" },
        w: { type: "number" },
      },
    },
    instock: { type: "boolean" },
  },
};

// queries documents using schema validation
find(docs, { $jsonSchema: schema }, {}, { jsonSchemaValidator }).all();
```

**Note:** An error is thrown when the `$jsonSchema` operator is used without a the `jsonSchemaValidator` configured.

## Aggregation Pipeline

```js
import { Aggregator } from "mingo/aggregator";
import { useOperators, OperatorType } from "mingo/core";
import { $match, $group } from "mingo/operators/pipeline";
import { $min } from "mingo/operators/accumulator";

// ensure the required operators are preloaded prior to using them.
useOperators(OperatorType.PIPELINE, { $match, $group });
useOperators(OperatorType.ACCUMULATOR, { $min });

let agg = new Aggregator([
  { $match: { type: "homework" } },
  { $group: { _id: "$student_id", score: { $min: "$score" } } },
  { $sort: { _id: 1, score: 1 } },
]);

// return an iterator for streaming results
let stream = agg.stream(collection);

// return all results. same as `stream.all()`
let result = agg.run(collection);
```

## Options

Query and aggregation operations can be configured with options to enabled different features or customize how documents are processed. Some options are only relevant to specific operators and need not be specified if not required.

```js
interface Options {
  /** The key that is used to lookup the ID value of a document. @default "_id" */
  readonly idKey?: string;
  /** The collation specification for string operations. */
  readonly collation?: CollationSpec;
  /** Processing mode that determines how to treat inputs and outputs. @default ProcessingMode.CLONE_OFF */
  readonly processingMode?: ProcessingMode;
  /**
   * Enables or disables custom script execution.
   * When disabled, you cannot use operations that execute custom code, such as the $where, $accumulator, and $function.
   * @default true
   */
  readonly scriptEnabled?: boolean;
  /** Hash function to replace the somewhat weaker default implementation. */
  readonly hashFunction?: HashFunction;
  /** Function to resolve string reference to a collection for use by `$lookup` and `$out` operators. */
  readonly collectionResolver?: CollectionResolver;
  /** JSON schema validator to use with the $jsonSchema operator. Required to use the operator. */
  readonly jsonSchemaValidator?: JsonSchemaValidator;
}
```

## Differences from MongoDB

1. There are no collections. Data for processing is either an array of objects or a generator function to support streaming.
1. The `collectionResolver` option can be configured to reference an array using a name for lookup instead of providing the reference directly. See [$lookup](https://docs.mongodb.com/manual/reference/operator/aggregation/lookup/) and [$out](https://docs.mongodb.com/manual/reference/operator/aggregation/out/).
1. The following operators are not supported.
   - Query: `$comment`, `$meta`, `$text`
   - Expression: `$toObjectId`, `$binarySize`, `bsonSize`
   - Pipeline: `$merge`
1. Custom function evaluation operators `$where`, `$function`, and `$accumulator` DO NOT accept strings as the function body.
1. Custom function evaluation operators are enabled by default. They can be disabled with the `scriptEnabled` option.
1. Expression operator [$accumulator](https://docs.mongodb.com/manual/reference/operator/aggregation/accumulator/) does not support the `merge` option.

**Note**: Any server-side specific feature is not supported.

## Benefits

- Better alternative to writing custom code for transforming collection of objects
- Quick validation of MongoDB queries without the need for a database
- MongoDB query language is among the best in the market and is well documented

## Contributing

- Squash changes into one commit
- Run `npm test` to build and execute unit tests
- Submit pull request

## License

MIT
