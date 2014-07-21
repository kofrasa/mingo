# Mingo
A JavaScript implementation of mongo-esque query language

## Dependencies
[underscore](https://github.com/jashkenas/underscore)

## Features
- Simple Comparisons ($gt, $gte, $lt, $lte, $regex, $mod, $ne, $nin, $in, $all, $not, $elemMatch)
- Full conjunction support ($and, $or, $nor)
- Aggregation Pipeline Support ($group, $match, $project, $sort, $limit, $unwind)
- Expression Operators ($add, $subtract, $divide, $multiply, $cmp, $strcasecmp, $concat, $substr, $toLower, $toUpper)
- Group Operators ($addToSet, $sum, $max, $min, $avg, $push, $first, $last)
- Projection Operators ($elemMatch, $slice)

## Installing
$ npm install mingo

## Usage
~~~javascript

var Mingo = require('mingo');

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
~~~

### Searching and Filtering
~~~javascript
// filter collection with find()
var cursor = query.find(collection);

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

// Removing matched objects
var result = query.remove(collection);
~~~

### Aggregation Pipeline
~~~javascript
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
~~~

## Backbone Integration
~~~javascript
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
~~~


*Sample collection is an extract from course files from [10gen Education](https://education.10gen.com/courses/10gen/M101P/2013_April/info)*