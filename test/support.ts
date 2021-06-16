import "../src/init/system";

import tape from "tape";

import { aggregate } from "../src";
import { computeValue } from "../src/core";
import { RawArray, RawObject } from "../src/types";
import { isObjectLike } from "../src/util";
import complexGrades from "./data/grades_complex";
import simpleGrades from "./data/grades_simple";
import person from "./data/person";
import students from "./data/students";

export const complexGradesData = complexGrades;
export const simpleGradesData = simpleGrades;
export const studentsData = students;
export const personData = person;

/* eslint-disable @typescript-eslint/restrict-template-expressions */

export const groupByObjectsData = [
  {
    date_buckets: {
      date: "2015-04-29T00:17:03.107Z",
      day: 28,
      hour: 18,
      minute: 17,
      sec: 3,
      hour_minute: "18:17",
    },
    "Keyword ID": "sr3_4VzRD3sp",
    "Creative ID": "5184986203",
    Keyword: "Bathroom Cleaning Tips",
    "Match Type": "be",
    Device: "m",
    Conversions: [
      1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 1, 0, 0, 0, 0, 0, 0,
    ],
    Revenues: [
      1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 1, 0, 0, 0, 0, 0, 0,
    ],
    account_id: "baron",
  },
  {
    date_buckets: {
      date: "2015-04-29T00:17:03.107Z",
      day: 28,
      hour: 18,
      minute: 17,
      sec: 3,
      hour_minute: "18:17",
    },
    "Keyword ID": "sr3_K1iQOeXy",
    "Creative ID": "5184986241",
    Keyword: "Cleaning Bathroom Tips",
    "Match Type": "bb",
    Device: "c",
    Conversions: [
      5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 5, 0, 0, 0, 0, 0, 0,
    ],
    Revenues: [
      5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 5, 0, 0, 0, 0, 0, 0,
    ],
    account_id: "baron",
  },
  {
    date_buckets: {
      date: "2015-04-29T00:17:03.108Z",
      day: 28,
      hour: 18,
      minute: 17,
      sec: 3,
      hour_minute: "18:17",
    },
    "Keyword ID": "sr3_sl0C3VAYk",
    "Creative ID": "44210589597",
    Keyword: "best way to clean a bathroom",
    "Match Type": "b",
    Device: "c",
    Conversions: [
      4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 4, 0, 0, 0, 0, 0, 0,
    ],
    Revenues: [
      4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 4, 0, 0, 0, 0, 0, 0,
    ],
    account_id: "baron",
  },
  {
    date_buckets: {
      date: "2015-04-29T00:17:03.108Z",
      day: 28,
      hour: 18,
      minute: 17,
      sec: 3,
      hour_minute: "18:17",
    },
    "Keyword ID": "sr3_4VzRD3sp",
    "Creative ID": "5184986204",
    Keyword: "Bathroom Cleaning Tips",
    "Match Type": "be",
    Device: "c",
    Conversions: [
      1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 1, 0, 0, 0, 0, 0, 0,
    ],
    Revenues: [
      1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 1, 0, 0, 0, 0, 0, 0,
    ],
    account_id: "baron",
  },
  {
    date_buckets: {
      date: "2015-04-29T00:17:03.107Z",
      day: 28,
      hour: 18,
      minute: 17,
      sec: 3,
      hour_minute: "18:17",
    },
    "Keyword ID": "sr3_HZAarvKy",
    "Creative ID": "6074827333",
    Keyword: "Drain Clogs",
    "Match Type": "bp",
    Device: "c",
    Conversions: [1, 0, 0, 1, 0, 0, 0, 0, 0],
    Revenues: [5, 0, 0, 5, 0, 0, 0, 0, 0],
    account_id: "baron",
  },
  {
    date_buckets: {
      date: "2015-04-29T00:17:03.107Z",
      day: 28,
      hour: 18,
      minute: 17,
      sec: 3,
      hour_minute: "18:17",
    },
    "Keyword ID": "sr3_irU8fFk0",
    "Creative ID": "6074827289",
    Keyword: "unclog bathtub drain",
    "Match Type": "bp",
    Device: "c",
    Conversions: [1, 0, 0, 1, 0, 0, 0, 0, 0],
    Revenues: [5, 0, 0, 5, 0, 0, 0, 0, 0],
    account_id: "baron",
  },
];

export function runTest(
  description: string,
  suite: Record<string, RawArray>
): void {
  Object.entries(suite).forEach((arr) => {
    const operator = arr[0];
    const examples = arr[1] as Array<Array<unknown>>;
    tape(description + ": " + operator, (t) => {
      examples.forEach((val) => {
        let input = val[0];
        let expected = val[1];
        const ctx = (val[2] || { err: false }) as RawObject;
        const obj = ctx?.obj || {};

        let field = operator;
        // use the operator as field if not present in input
        if (!!input && input.constructor === Object) {
          field = Object.keys(input).find((s) => s[0] === "$") || null;
          if (field === null) {
            field = operator;
          } else {
            input = input[field];
          }
        }

        if (ctx.err) {
          t.throws(
            () => computeValue(obj, input, field),
            `${operator}(${
              isObjectLike(input) ? JSON.stringify(input) : input
            }) => Error("${expected}")`
          );
        } else {
          let actual = computeValue(obj, input, field);
          // NaNs don't compare
          if (actual !== actual && expected !== expected) actual = expected = 0;
          t.deepEqual(
            actual,
            expected,
            `${operator}(${
              isObjectLike(input) ? JSON.stringify(input) : input
            }) => ` +
              `${isObjectLike(expected) ? JSON.stringify(expected) : expected}`
          );
        }
      });
      t.end();
    });
  });
}

interface PipelineTestSuite {
  input: RawArray;
  query: Array<RawObject>;
  check: RawArray | ((result: RawArray, test: tape.Test) => void);
  message?: string;
}
/**
 * run pipeline test
 */
export function runTestPipeline(
  description: string,
  suite: Array<PipelineTestSuite>
): void {
  tape(description, (t) => {
    suite.forEach((unitTest) => {
      const input = unitTest.input;
      const pipeline = unitTest.query;
      const check = unitTest.check;
      const message = unitTest.message || "actual equals expected";
      const actual = aggregate(input, pipeline);
      if (typeof check === "function") {
        check(actual, t);
      } else {
        t.deepEqual(actual, check, message);
      }
    });
    t.end();
  });
}
