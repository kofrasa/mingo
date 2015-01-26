# Mingo
JavaScript implementation of MongoDB query language

Mingo harnesses the power of MongoDB-style queries and allows direct querying of in-memory 
javascript objects in both client and server-side environments.

[![build status](https://secure.travis-ci.org/kofrasa/mingo.png)](http://travis-ci.org/kofrasa/mingo)

## Dependencies
[underscore](https://github.com/jashkenas/underscore)

## Installing
```$ npm install mingo```

In browser
```html
<!-- DO NOT FORGET Underscore -->
<script type="text/javascript" src="./underscore-min.js"></script>
<script type="text/javascript" src="./mingo-min.js"></script>
```

## Features
- Comparisons Operators ($gt, $gte, $lt, $lte, $ne, $nin, $in)
- Logical Operators ($and, $or, $nor, $not)
- Evaluation Operators ($regex, $mod, $where)
- Array Operators ($all, $elemMatch, $size)
- Element Operators ($exists, $type)
- Aggregation Pipeline Operators ($group, $match, $project, $sort, $limit, $unwind, $skip)
- Conditional Operators ($cond, $ifNull)
- Group Operators ($addToSet, $sum, $max, $min, $avg, $push, $first, $last)
- Arithmetic Operators ($add, $divide, $mod, $multiply, $subtract)
- String Operators ($cmp, $strcasecmp, $concat, $substr, $toLower, $toUpper)
- Set Operators ($setEquals, $setIntersection, $setDifference, $setUnion, $setIsSubset, $anyElementTrue, $allElementsTrue)
- Projection Operators ($elemMatch, $slice)
- JSON stream filtering and projection. ***NodeJS only***

## Usage
```javascript

var Mingo = require('mingo');
// or just access *Mingo* global in browser

// setup the key field for your collection
Mingo.setup({
    key: '_id' // default
});

// create a query with criteria
// find all grades for homework with score >= 50
var query = new Mingo.Query({
    type: "homework",
    score: { $gte: 50 }
});
```

## Searching and Filtering
```javascript
// filter collection with find()
var cursor = query.find(collection);

// shorthand with query criteria
// cursor = Mingo.find(collection, criteria);

// sort, skip and limit by chaining
cursor.sort({student_id: 1, score: -1})
    .skip(100)
    .limit(100);

// count matches
cursor.count();

// iterate cursor
// iteration is forward only
while (cursor.hasNext()) {
    console.log(cursor.next());
}

// use first(), last() and all() to retrieve matched objects
cursor.first();
cursor.last();
cursor.all();

// Filter non-matched objects (
var result = query.remove(collection);
```

## Aggregation Pipeline
```javascript
var agg = new Mingo.Aggregator([
    {'$match': { "type": "homework"}},
    {'$group':{'_id':'$student_id', 'score':{$min:'$score'}}},
    {'$sort':{'_id': 1, 'score': 1}}
]);

var result = agg.run(collection);

// shorthand
result = Mingo.aggregate(
    collection,
    [
        {'$match': { "type": "homework"}},
        {'$group':{'_id':'$student_id', 'score':{$min:'$score'}}},
        {'$sort':{'_id': 1, 'score': 1}}
    ]
);
```

## Stream Filtering
```js
var JSONStream = require('JSONStream'),
    fs = require('fs'),
    Mingo = require('mingo');

var query = new Mingo.Query({
  scores: { $elemMatch: {type: "exam", score: {$gt: 90}} }
}, {name: 1});

// ex. [
//      { "_id" : 11, "name" : "Marcus Blohm", "scores" : [
//          { "type" : "exam", "score" : 78.42617835651868 },
//          { "type" : "quiz", "score" : 82.58372817930675 },
//          { "type" : "homework", "score" : 87.49924733328717 },
//          { "type" : "homework", "score" : 15.81264595052612 } ]
//      },
//      ...
//     ]
file = fs.createReadStream('./students.json');

var qs = query.stream();
qs.on('data', function (data) {
    console.log(data); // log filtered outputs
    // ex. { name: 'Dinah Sauve', _id: 49 }
});

file.pipe(JSONStream.parse("*")).pipe(qs);

```

## Backbone Integration
```javascript
// using with Backbone
var Grades = Backbone.Collection.extend(Mingo.CollectionMixin);

var grades = new Grades(collection);

// find students with grades less than 50 in homework or quiz
// sort by score ascending and type descending
cursor = grades.query({
    $or: [{type: "quiz", score: {$lt: 50}}, {type: "homework", score: {$lt: 50}}]
}).sort({score: 1, type: -1}).limit(10);

// print grade with the lowest score
cursor.first();
```

For documentation on using query operators see [mongodb](http://docs.mongodb.org/manual/reference/operator/query/)

## API
### Mingo.Query(criteria, [projection])
Creates a ```Mingo.Query``` object with the given query criteria
- ```test(obj)``` Returns true if the object passes the query criteria, otherwise false.
- ```find(collection, [projection])``` Performs a query on a collection and returns a ```Mingo.Cursor``` object.
- ```remove(collection)``` Remove matching documents from the collection and return the remainder
- ```stream()``` Return a ```Mingo.Stream``` to filter and transform JSON objects from a readable stream. **NodeJS only**

### Mingo.Aggregator(expressions)
Creates a ```Mingo.Aggregator``` object with a collection of aggregation pipeline expressions
- ```run()``` Apply the pipeline operations over the collection by order of the sequence added

### Mingo.Cursor(collection, query, [projection])
Creates a ```Mingo.Cursor``` object which holds the result of applying the query over the collection
- ```all()``` Returns all the matched documents in a cursor as a collection.
- ```first()``` Returns the first documents in a cursor.
- ```last()``` Returns the last document in a cursor
- ```count()``` Returns a count of the documents in a cursor.
- ```limit(n)``` Constrains the size of a cursor's result set.
- ```skip(n)``` Returns a cursor that begins returning results only after passing or skipping a number of documents.
- ```sort(modifier)``` Returns results ordered according to a sort specification.
- ```next()``` Returns the next document in a cursor.
- ```hasNext()``` Returns true if the cursor has documents and can be iterated.
- ```max(expression)``` Specifies an exclusive upper index bound for a cursor
- ```min(expression)``` Specifies an inclusive lower index bound for a cursor.
- ```map(callback)``` Applies a function to each document in a cursor and collects the return values in an array.
- ```forEach(callback)``` Applies a JavaScript function for every document in a cursor.

### Mingo.Stream(query, [options]) - NodeJS only
A Transform stream that can be piped from/to any readable/writable JSON stream.

### Mingo.CollectionMixin
A mixin object for ```Backbone.Collection``` which adds ```query()``` and ```aggregate()``` methods
- ```query(criteria)``` Performs a query on the collection and returns a ```Mingo.Cursor``` object.
- ```aggregate(expressions)``` Performs aggregation operation using the aggregation pipeline.

### Mingo.find(collection, criteria, [projection])
Performs a query on a collection and returns a ```Mingo.Cursor``` object.

### Mingo.remove(collection, criteria)
Returns the non-matched objects as a collection from executing a ```Mingo.Query``` with the given criteria

### Mingo.aggregate(collection, expressions)
Performs aggregation operation using the aggregation pipeline.

## TODO
 - Geospatial Query Operators ($geoWithin, $geoIntersects, $near, $nearSphere)
 - Geometry Specifiers ($geometry, $maxDistance, $center, $centerSphere, $box, $polygon)

## License
MIT