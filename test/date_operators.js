var test = require('tape')
var Mingo = require('../mingo')


test("Date Operators", function (t) {
 t.plan(12);

 var result = Mingo.aggregate([{
   "_id": 1, "item": "abc", "price": 10, "quantity": 2, "date": new Date("2014-01-01T08:15:39.736Z")
 }], [{
   $project: {
     year: {$year: "$date"},
     month: {$month: "$date"},
     day: {$dayOfMonth: "$date"},
     hour: {$hour: "$date"},
     minutes: {$minute: "$date"},
     seconds: {$second: "$date"},
     milliseconds: {$millisecond: "$date"},
     dayOfYear: {$dayOfYear: "$date"},
     dayOfWeek: {$dayOfWeek: "$date"},
     week: {$week: "$date"},
     yearMonthDay: {$dateToString: {format: "%Y-%m-%d", date: "$date"}},
     time: {$dateToString: {format: "%H:%M:%S:%L", date: "$date"}}
   }
 }]);

 result = result[0];

 t.equals(result.year, 2014, "can apply $year");
 t.equals(result.month, 1, "can apply $month");
 t.equals(result.day, 1, "can apply $day");
 t.equals(result.hour, 8, "can apply $hour");
 t.equals(result.minutes, 15, "can apply $minutes");
 t.equals(result.seconds, 39, "can apply $seconds");
 t.equals(result.milliseconds, 736, "can apply $milliseconds");
 t.equals(result.dayOfWeek, 4, "can apply $dayOfWeek");
 t.equals(result.dayOfYear, 1, "can apply $dayOfYear");
 t.equals(result.week, 0, "can apply $week");
 t.equals(result.yearMonthDay, "2014-01-01", "formats date to string");
 t.equals(result.time, "08:15:39:736", "formats time to string");

 t.end();

});
