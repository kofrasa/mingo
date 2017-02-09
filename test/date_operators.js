var test = require('tape'),
  Mingo = require('../mingo'),
  samples = require('./samples'),
  _ = Mingo._internal();


// This test is timezone sensitive.

//test("Date Operators", function (t) {
//  t.plan(12);
//
//  var result = Mingo.aggregate([{
//    "_id": 1, "item": "abc", "price": 10, "quantity": 2, "date": new Date("2014-01-01T08:15:39.736Z")
//  }], [{
//    $project: {
//      year: {$year: "$date"},
//      month: {$month: "$date"},
//      day: {$dayOfMonth: "$date"},
//      hour: {$hour: "$date"},
//      minutes: {$minute: "$date"},
//      seconds: {$second: "$date"},
//      milliseconds: {$millisecond: "$date"},
//      dayOfYear: {$dayOfYear: "$date"},
//      dayOfWeek: {$dayOfWeek: "$date"},
//      week: {$week: "$date"},
//      yearMonthDay: {$dateToString: {format: "%Y-%m-%d", date: "$date"}},
//      time: {$dateToString: {format: "%H:%M:%S:%L", date: "$date"}}
//    }
//  }]);
//
//  result = result[0];
//
//  t.ok(result.year == 2014, "can apply $year");
//  t.ok(result.month == 1, "can apply $month");
//  t.ok(result.day == 1, "can apply $day");
//  t.ok(result.hour == 8, "can apply $hour");
//  t.ok(result.minutes == 15, "can apply $minutes");
//  t.ok(result.seconds == 39, "can apply $seconds");
//  t.ok(result.milliseconds == 736, "can apply $milliseconds");
//  t.ok(result.dayOfWeek == 4, "can apply $dayOfWeek");
//  t.ok(result.dayOfYear == 1, "can apply $dayOfYear");
//  t.ok(result.week == 0, "can apply $week");
//  t.ok(result.yearMonthDay == "2014-01-01", "formats date to string");
//  t.ok(result.time == "08:15:39:736", "formats time to string");
//
//  t.end();
//
//});
