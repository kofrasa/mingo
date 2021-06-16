import test from "tape";

import { Aggregator } from "../src/aggregator";
import { Query } from "../src/query";
import { simpleGradesData } from "./support";

test("10gen Education: M101P", (t) => {
  const cursor = new Query({
    type: "exam",
    score: { $gte: 65 },
  }).find(simpleGradesData);

  const student = cursor.sort({ score: 1 }).limit(1).next() as {
    student_id: number;
  };
  t.equal(student.student_id, 22, "Student ID with lowest exam score is 22");

  const homework = new Query({ type: "homework" })
    .find(simpleGradesData)
    .sort({ student_id: 1, score: 1 })
    .all() as typeof simpleGradesData;
  const ids = [];
  let sid: number | undefined;
  for (let i = 0; i < homework.length; i++) {
    if (homework[i]["student_id"] !== sid) {
      ids.push(homework[i]["_id"]);
      sid = homework[i]["student_id"];
    }
  }

  t.equal(ids.length, 200, "200 minimum homework scores found");
  const result = new Query({ _id: { $in: ids } }).remove(simpleGradesData);

  // let res = Mingo.find(result).sort({'score':-1}).skip(100).limit(1).next();
  // console.log(res);
  // Mingo.find(result, {}, {'student_id':1, 'type':1, 'score':1, '_id':0}).sort({'student_id':1, 'score':1}).limit(5);

  t.equal(
    result.length,
    600,
    "remove lowest homework from grades for each student. count is 600"
  );

  const res = new Aggregator([
    { $group: { _id: "$student_id", average: { $avg: "$score" } } },
    { $sort: { average: -1 } },
    { $limit: 1 },
  ]).run(result);
  t.equal(res[0]["_id"], 54, "student with highest average has id 54");
  t.end();
});
