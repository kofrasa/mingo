# Mingo
A JavaScript implementation of mongo-esque query language

# Dependencies
[underscore](https://github.com/jashkenas/underscore)

# Installing
```$ npm install mingo```

In browser
```html
<script type="text/javascript" src="./mingo-min.js"</script>
```

# Features
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
- Projection Operators ($elemMatch, $slice)

# Usage
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

// shorthand
var result = Mingo.find(collection, {
                    type: "homework",
                    score: { $gte: 50 }
                });

~~~

## Searching and Filtering
```javascript
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

# API
### Mingo.Query(expression)
Creates a new ```Mingo.Query``` object with the given query expression

### Mingo.Aggregate(expressions)
Creates a new ```Mingo.Aggregate``` object with a collection of aggregation pipeline expressions

### Mingo.find(collection, expression)
Returns the matching objects from compiling and running the query expression against the given collection

### Mingo.remove(collection, expression)
Returns the non-matching objects from compiling and running the query expression against the given collection

### Mingo.aggregate(collection, expressions)
Returns the result of running the aggregate expressions sequentially over the given collection


# License
MIT Copyright (c) 2013 Francis Asante