var test = require('tape')
var mingo = require('../../dist/mingo')


test("Date Operators", function (t) {

  var projectionOperator = {
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
  }

  var result = mingo.aggregate([{
    "_id": 1, "item": "abc", "price": 10, "quantity": 2, "date": new Date("2014-01-01T08:15:39.736Z")
  }], [ projectionOperator ]).pop()

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

  // Test date operators with timezone

  result = mingo.aggregate([{
    "_id": 1, "item": "abc", "price": 10, "quantity": 2, "date": {
      date: new Date("2014-01-01T08:15:39.736Z"),
      timezone: "-0700"
    }
  }], [ projectionOperator ]).pop()

  t.equals(result.hour, 1, "can apply $hour with timezone");

  result = mingo.aggregate([
    { _id: 1, date: "2017-02-08T12:10:40.787", timezone: "+0530", message:  "Step 1: Started" },
    { _id: 2, date: "2017-02-08", timezone: "-05:00", message:  "Step 1: Ended" },
    { _id: 3, message:  "Step 1: Ended" },
    { _id: 4, date: "2017-02-09", timezone: "+0000", message: "Step 2: Started"},
    { _id: 5, date: "2017-02-09T03:35:02.055", timezone: "+0530" },
    { _id: 6, date: "20177-02-09T03:35:02.055", timezone: "+0530" }
  ], [{
    $project: {
      date: {
        $dateFromString: {
          dateString: '$date',
          timezone: "+0530",
          onError: '$date'
        }
      }
    }
  }])

  t.deepEqual(result, [
    { "_id" : 1, "date" : new Date("2017-02-08T17:10:40.787Z") },
    { "_id" : 2, "date" : new Date("2017-02-08T05:00:00Z") },
    { "_id" : 3, "date" : null },
    { "_id" : 4, "date" : new Date("2017-02-09T05:00:00Z") },
    { "_id" : 5, "date" : new Date("2017-02-09T08:35:02.055Z") },
    { "_id" : 6, "date" : "20177-02-09T03:35:02.055" }
  ], "can apply $dateFromString")


  result = mingo.aggregate([
    { "_id" : 1, "date" : "2017-02-08T12:10:40.787", timezone: "+0530" },
    { "_id" : 2, "date" : null, timezone: "+0530" }
  ], [ {
    $project: {
      date: {
        $dateFromString: {
          dateString: '$date',
          timezone: '$timezone',
          onNull: new Date(0)
        }
      }
    }
  }])
  t.deepEqual(result, [
    { "_id" : 1, "date" : new Date("2017-02-08T17:10:40.787Z") },
    { "_id" : 2, "date" : new Date("1970-01-01T00:00:00Z") }
  ], "can apply $dateFromString with onNull option")

  t.end();

});
