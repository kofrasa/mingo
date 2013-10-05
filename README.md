Mingo
=====
A Javascript implementation of mongo-esque query language for collection manipulation


Dependencies
-------------
[underscore](https://github.com/jashkenas/underscore) by Jeremy Ashkenas
Thank you and your fellow contributors


Features
---------
- Simple Comparisons ($gt, $gte, $lt, $lte, $regex, $mod, $ne, $nin, $in, $all, $not)
- Full conjunction support ($and, $or, $nor)
- Aggregation Pipeline Support ($group, $match, $project, $sort, $limit, $unwind)
- Aggregation Operators ($add, $subtract, $divide, $multiply, $cmp, $strcasecmp, $concat, $substr, $toLower, $toUpper)
- Group Operators ($addToSet, $sum, $max, $min, $avg, $push, $first, $last)


Installing
------------
Still in development so you will have to clone the project for now.

    $ git clone git://github.com/kofrasa/mingo.git


Examples
----------

~~~javascript
var collection = [
    { "_id" : { "$oid" : "50906d7fa3c412bb040eb577" }, "student_id" : 0, "type" : "exam", "score" : 54.6535436362647 },
    { "_id" : { "$oid" : "50906d7fa3c412bb040eb578" }, "student_id" : 0, "type" : "quiz", "score" : 31.95004496742112 },
    { "_id" : { "$oid" : "50906d7fa3c412bb040eb579" }, "student_id" : 0, "type" : "homework", "score" : 14.8504576811645 },
    { "_id" : { "$oid" : "50906d7fa3c412bb040eb57a" }, "student_id" : 0, "type" : "homework", "score" : 63.98402553675503 },
    { "_id" : { "$oid" : "50906d7fa3c412bb040eb57b" }, "student_id" : 1, "type" : "exam", "score" : 74.20010837299897 },
    { "_id" : { "$oid" : "50906d7fa3c412bb040eb57c" }, "student_id" : 1, "type" : "quiz", "score" : 96.76851542258362 },
    { "_id" : { "$oid" : "50906d7fa3c412bb040eb88e" }, "student_id" : 197, "type" : "homework", "score" : 88.3871242475841 },
    { "_id" : { "$oid" : "50906d7fa3c412bb040eb88f" }, "student_id" : 198, "type" : "exam", "score" : 49.65504121659061 },
    { "_id" : { "$oid" : "50906d7fa3c412bb040eb890" }, "student_id" : 198, "type" : "quiz", "score" : 83.44326100636312 },
    { "_id" : { "$oid" : "50906d7fa3c412bb040eb891" }, "student_id" : 198, "type" : "homework", "score" : 76.18366499496366 },
    { "_id" : { "$oid" : "50906d7fa3c412bb040eb892" }, "student_id" : 198, "type" : "homework", "score" : 17.46279901047208 },
    { "_id" : { "$oid" : "50906d7fa3c412bb040eb893" }, "student_id" : 199, "type" : "exam", "score" : 67.33828604577803 },
    { "_id" : { "$oid" : "50906d7fa3c412bb040eb894" }, "student_id" : 199, "type" : "quiz", "score" : 48.15737364405101 },
    { "_id" : { "$oid" : "50906d7fa3c412bb040eb895" }, "student_id" : 199, "type" : "homework", "score" : 49.34223066136407 },
    { "_id" : { "$oid" : "50906d7fa3c412bb040eb896" }, "student_id" : 199, "type" : "homework", "score" : 58.09608083191365 }
];

// first example

// create a query with a criteria
var query = new Mingo.Query({
    type: "homework",
    score: { $gte: 50 }
});

// execute query on a collection with find()
var cursor = query.find(collection);

// count matches
console.log("homeworks >= 50 " + cursor.count());

// iterate cursor
// iteration is forward only
while (cursor.hasNext()) {
    console.log(cursor.next());
}

// use first() or all() to retrieve first or all matched objects
console.log(cursor.first());
console.log(cursor.last());
console.log(cursor.all());

// second example

// use short hand
query = Mingo.compile({
    score: { $gt: 50 },
});

// project (student_id, type, score) and sort by score
cursor = query.find(collection, {student_id: 1, type: 1}).sort({score: 1});
console.log("all grades > 50 sorted by score: " + cursor.count());

console.log(cursor.first()); // log the first highest record

// using with Backbone
var Grades = Backbone.Collection.extend(Mingo.CollectionMixin);

var grades = new Grades(collection);
// find students with grades less than 50 in homework or quiz
// sort by score ascending and type descending
cursor = grades.query({
    $or: [{type: "quiz", score: {$lt: 50}}, {type: "homework", score: {$lt: 50}}]
}).sort({score: 1, type: -1}).limit(10);

// print grade with the lowest score
console.log(cursor.first());
~~~

More to come soon...


*Sample collection is an extract from course files from [10gen Education](https://education.10gen.com/courses/10gen/M101P/2013_April/info)*