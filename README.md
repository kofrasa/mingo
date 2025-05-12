# mingo

MongoDB query language for in-memory objects

![license](https://img.shields.io/github/license/kofrasa/mingo)
[![version](https://img.shields.io/npm/v/mingo)](https://www.npmjs.org/package/mingo)
[![build](https://github.com/kofrasa/mingo/actions/workflows/build.yml/badge.svg)](https://github.com/kofrasa/mingo/actions/workflows/build.yml)
![issues](https://img.shields.io/github/issues/kofrasa/mingo)
[![codecov](https://img.shields.io/codecov/c/github/kofrasa/mingo)](https://codecov.io/gh/kofrasa/mingo)
[![npm downloads](https://img.shields.io/npm/dm/mingo)](https://www.npmjs.org/package/mingo)

## Install

`$ npm install mingo`

## Features

- Dot notation selectors. _`<array>.<index>`_ and _`<document>.<field>`_.
- Query and Projection [operators](https://www.mongodb.com/docs/manual/reference/operator/.query/).
- Aggregation Framework.
  - [Pipeline operators](https://docs.mongodb.com/manual/reference/operator/aggregation-pipeline/)
  - [Accumulator operators](https://docs.mongodb.com/manual/reference/operator/aggregation#accumulators-group/)
  - [Expression operators](https://docs.mongodb.com/manual/reference/operator/aggregation/#expression-operators)
  - [Window operators](https://docs.mongodb.com/manual/reference/operator/aggregation/setWindowFields/#window-operators)
- Aggregation variables; [`$$ROOT`, `$$CURRENT`, `$$DESCEND`, `$$PRUNE`, `$$KEEP`, `$$REMOVE`, `$$NOW`](https://docs.mongodb.com/manual/reference/aggregation-variables/)
- Filtering and aggregation using streaming.
- Document [update](https://www.mongodb.com/docs/manual/reference/operator/update/) support. See [Updating Documents](#updating-documents).
- Custom type value equality using `toString` when implemented.

For more documentation on how to use operators see [mongodb](http://docs.mongodb.org/manual/reference/operator/).

[API Documentation](http://kofrasa.github.io/mingo/).

A minified version with full operator support is available under [dist/mingo.min.js](https://www.npmjs.com/package/mingo?activeTab=code) on NPM since `6.6.0`.

## Usage

```js
// Use as es6 module
import mingo from "mingo";

// or vanilla nodeJS
const mingo = require("mingo");
```

The main module exports functions `aggregate`, `find`, `remove`, and `update`, and the objects `Aggregator` and `Query`. [Query and Projection](https://docs.mongodb.com/manual/reference/operator/query/) operators are loaded by default by the root through the side-effect module [init/basic](https://github.com/kofrasa/mingo/blob/main/src/init/basic.ts). This also automatically includes pipeline operators; `$project`, `$skip`, `$limit`, and `$sort`.

## Loading Operators

MongoDB query library is huge and you may not need all the operators. When using this library on the server-side where bundle size is not a concern, you can load all operators as shown below.

```js
// This effectively imports the entire library into your bundle.
import "mingo/init/system";
```

Or from the node CLI

```sh
node -r 'mingo/init/system' myscript.js
```

To support tree-shaking for client side bundles, you can import and register specific operators that will be used in your application.

### ES6

```js
import { useOperators } from "mingo/core";
import { $trunc } from "mingo/operators/expression";
import { $bucket } from "mingo/operators/pipeline";

useOperators("expression", { $trunc });
useOperators("pipeline", { $bucket });
```

### CommonJS

```js
const useOperators = require("mingo/core").useOperators;
const $trunc = require("mingo/operators/expression").$trunc;
const $bucket = require("mingo/operators/pipeline").$bucket;

useOperators("expression", { $trunc });
useOperators("pipeline", { $bucket });
```

## Using query to test objects

```js
import { Query } from "mingo";

// create a query with criteria
// find all grades for homework with score >= 50
let query = new Query({
  type: "homework",
  score: { $gte: 50 }
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
import * as mingo from "mingo"
import type { AnyObject } from "mingo/types"
import type { JsonSchemaValidator } from "mingo/core"
import Ajv, { Schema } from "ajv"

const jsonSchemaValidator: JsonSchemaValidator = (s: AnyObject) => {
  const ajv = new Ajv();
  const v = ajv.compile(s as Schema);
  return (o: AnyObject) => (v(o) ? true : false);
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
mingo.find(docs, { $jsonSchema: schema }, {}, { jsonSchemaValidator }).all();
```

**Note:** An error is thrown when the `$jsonSchema` operator is used without a the `jsonSchemaValidator` configured.

## Aggregation Pipeline

```js
import { Aggregator } from "mingo/aggregator";
import { useOperators } from "mingo/core";
import { $match, $group } from "mingo/operators/pipeline";
import { $min } from "mingo/operators/accumulator";

// ensure the required operators are preloaded prior to using them.
useOperators("pipeline", { $match, $group });
useOperators("accumulator", { $min });

let agg = new Aggregator([
  { $match: { type: "homework" } },
  { $group: { _id: "$student_id", score: { $min: "$score" } } },
  { $sort: { _id: 1, score: 1 } }
]);

// return an iterator for streaming results
let stream = agg.stream(collection);

// return all results. same as `stream.all()`
let result = agg.run(collection);
```

## Options

Query and aggregation operations can be configured with options to enabled different features or customize how documents are processed. Some options are only relevant to specific operators and need not be specified if not required.

| Name | Default | Description |
| -----| --------| ----------- |
| collation |  _none_ | [Collation](http://kofrasa.github.io/mingo/interfaces/core.CollationSpec.html) specification for string sorting operations. See [Intl.Collator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Collator) |
| collectionResolver | _none_ | <p>Function to resolve strings to arrays for use with operators that reference other collections such as; `$lookup`, `$out` and `$merge`.</p>Expects: `(string) => AnyObject[]`. |
| context | _none_ | <p>An object that defines which operators should be used.</p>This option allow users to load only desired operators or register custom operators which need not be available globally. |
| hashFunction | _default_ | <p>Custom hash function to replace the default based on "Effective Java" hashCode.</p>Expects: `(Any) => number`. |
| idKey |  `"_id"` | <p>The key that is used to lookup the ID value of a document.</p> |
| jsonSchemaValidator | _none_ | <p>JSON schema validator to use for the `$jsonSchema` operator.</p>Expects: `(schema: AnyObject) => (document: AnyObject) => boolean`.<br>The `$jsonSchema` operation would fail if a validator is not provided. |
| processingMode |  [CLONE_OFF](http://kofrasa.github.io/mingo/enums/core.ProcessingMode.html) | <p>Specifies the degree of mutation for inputs and outputs. By default the input collection is modified as needed and returned output objects may share references.</p> Immutable intermediate results may be collected in a pipeline using the `$out` operator. |
| scriptEnabled | `true` | <p>Enable or disable using custom script execution.</p>When disabled, operators that execute custom code are disallowed such as; `$where`, `$accumulator`, and `$function`. |
| useGlobalContext | `true`| <p>Fallback to the global context if an operator is missing from the user-supplied context.</p>This is provided to allow users to strictly enforce which operators may be used. |
| useStrictMode |  `true` | <p>Enforces strict MongoDB compatibility.</p>When disabled the behaviour changes as follows. <ul><li>`$elemMatch` returns all matching nested documents instead of only the first.</li><li>Empty string `""` is coerced to false during boolean checking in supported operators which is consistent with Javascript semantics.</li><li>`$type` returns JS native type names as follows. <table><thead><tr><td>MongoDB</td><td>JavaScript</td></tr></thead><tr><td><code>"missing"</code></td><td><code>"undefined"</code></td></tr><tr><td><code>"bool"</code></td><td><code>"boolean"</code></td></tr><tr><td><code>"int"&#124;"long"&#124;"double"</code></td><td><code>"number"</code></td></tr><tr><td><code>"regex"</code></td><td><code>"regexp"</code></td></tr></table> |
| variables | `{}` | Global variables to pass to all operators |

## Custom Operators

Custom operators can be registered using a `Context` object via the `context` option which is the recommended way since `6.4.2`. `Context` provides a container for operators, that the execution engine will use to process queries. To register an operator globally, the [useOperators(...)](https://kofrasa.github.io/mingo/functions/core.useOperators.html) function is available. Globally registered operators cannot be overwritten whereas a new context may be created and used at anytime.

**NB: Note that the execution engine will first try to find the operator in the context and fallback to the global context when not found if the `useGlobalContext` option is `true`.**

Custom operators must conform to the signatures of their types.

- [AccumulatorOperator](http://kofrasa.github.io/mingo/types/core.AccumulatorOperator.html)
- [ExpressionOperator](http://kofrasa.github.io/mingo/types/core.ExpressionOperator.html)
- [ProjectionOperator](http://kofrasa.github.io/mingo/types/core.ProjectionOperator.html)
- [PipelineOperator](http://kofrasa.github.io/mingo/types/core.PipelineOperator.html)
- [WindowOperator](http://kofrasa.github.io/mingo/types/core.WindowOperator.html)
- [QueryOperator](http://kofrasa.github.io/mingo/types/core.QueryOperator.html)

To define custom operators, the following imports are useful.

```js
const mingo = require("mingo")
const core = require("mingo/core");
const util = require("mingo/util");
```

### Custom Operator Examples
```js
// this example creates a query operator that checks is a value is between a boundary.
const $between = (selector, args, options) => {
  return (obj) => {
    const value = util.resolve(obj, selector, { unwrapArray: true });
    return value >= args[0] && value <= args[1];
  };
}
// a test collection
const collection = [
  { a: 1, b: 1 },
  { a: 7, b: 1 },
  { a: 10, b: 6 },
  { a: 20, b: 10 }
];
```

#### Register custom operator using the context option.
The custom operator is registered with a user-provided context object that is passed an option to the query. The context will be searched for operators used in a query and fallback to the global context when not found.

```ts
const context = core.Context.init().addQueryOps({ $between })
// must specify context option to make operator available
const result = mingo.find(collection, { a: { $between: [5, 10] } }, {}, { context }).all()
console.log(result) // output => [ { a: 7, b: 1 }, { a: 10, b: 6 } ]
```

#### Register custom operator globally using useOperators.

The custom operator is registered to be available globally.

```ts
// register the operator for global use.
try {
  core.useOperators("query", { $between })
} catch {
  // error thrown if an operator with name "$between" is already registered.
}
// query with new operator
const result = mingo.find(collection, { a: { $between: [5, 10] }}).all()
console.log(result) // output => [ { a: 7, b: 1 }, { a: 10, b: 6 } ]
```

## Updating Documents

An update operation can be performed using the `update` function from the `mingo/updater` module. Unlike other operations in the library, this only works on a single object.
The query and aggregation operators are powerful enough to use for transforming arrays of documents and should be preferred when dealing with multiple objects.
`update` returns an array of all paths that were updated. It also supports [arrayFilters](https://www.mongodb.com/docs/manual/release-notes/3.6/#std-label-3.6-arrayFilters) for applicable operators. To detect whether a change occurred you can check the length of the returned array.

All operators as of MongoDB 5.0 are supported except the positional array operator `$`.

### Examples

```ts
import { update } from "mingo";
// all update operators are automatically loaded.

const obj = {
  firstName: "John",
  lastName: "Wick",
  age: 40,
  friends: ["Scooby", "Shagy", "Fred"]
};

// returns array of modified paths if value changed.
update(obj, { $set: { firstName: "Bob", lastName: "Doe" } }); // ["firstName", "lastName"]

// update nested values.
update(obj, { $pop: { friends: 1 } }); // ["friends"] => friends: ["Scooby", "Shagy"]
// update nested value path
update(obj, { $unset: { "friends.1": "" } }); // ["friends.1"] => friends: ["Scooby", null]
// update with condition
update(obj, { $set: { "friends.$[e]": "Velma" } }, [{ e: null }]); // ["friends"] => friends: ["Scooby", "Velma"]
// empty array returned if value has not changed.
update(obj, { $set: { fristName: "Bob" } }); // [] => no change to object.
```

You can also create a preconfigured updater function.

```ts
import { createUpdater } from "mingo/updater";

// configure updater to deep clone passed values. clone mode defaults to "copy".
const updateState = createUpdater({ cloneMode: "deep" });

const state = { people: ["Fred", "John"] };
const newPeople = ["Amy", "Mark"];

console.log(state.people); // ["Fred", "John"]

updateState(state, { $set: { people: newPeople } });

newPeople.push("Jason");

console.log(state.people); // ["Amy", "Mark"]
console.log(newPeople); // ["Amy", "Mark", "Jason"]
```

## Differences from MongoDB

Below is a description of how this library differs from the full MongoDB query engine.

1. There is no concept of a collection. Input is an array, generator or iterable of objects.
1. Support a single numeric type `number`.
1. Does not support [types](https://www.mongodb.com/docs/manual/reference/operator/aggregation/type/#available-types) `"minKey"`, `"maxKey"`, `"timestamp"`, or `"binData"`.
1. Does not support server specific operators. E.g. `$collStat`, `$planCacheStats`, `$listSessions`.
1. Does not support geometry query operators.
1. Does not support query operators dependent on persistent storage; `$comment`, `$meta`, `$text`.
1. Does not support positional query or update operator `$`.
1. Does not support server specific expression operators; `$toObjectId`, `$binarySize`, `bsonSize`.
1. Aggregation pipeline operator `$merge` enforces unique constraint on the lookup field during input processing.
1. Custom function evaluation operators; `$where`, `$function`, and `$accumulator`, do not accept strings as the function body.
1. Custom function evaluation operators are enabled by default. They can be disabled with the `scriptEnabled` option.
1. Custom function evaluation operator [$accumulator](https://docs.mongodb.com/manual/reference/operator/aggregation/accumulator/) does not support the `merge` option.
1. The `$jsonSchema` operator requires the user to register their own validator using the `jsonSchemaValidator` configuration.

## Benefits

- Declarative data driven API.
- Usable on both frontend and backend.
- Provides an alternative to writing custom code for transforming objects.
- Validate MongoDB queries without running a server.
- Well documented. MongoDB query language is among the best available and has great documentation.

## Contributing

- Squash changes into one commit.
- Run `npm test` to build and run unit tests.
- Submit pull request.

To validate correct behaviour and semantics of operators, you may also test against [mongoplayground.net](https://mongoplayground.net/). Credit to the author _[@feliix](https://github.com/feliixx)_.

A big thank you to all users and [CONTRIBUTORS](https://github.com/kofrasa/mingo/graphs/contributors) of this library.

## License

MIT
