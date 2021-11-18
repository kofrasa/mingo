import "../../src/init/system";

import { aggregate } from "../../src";

describe("expression/set", () => {
  const experiments = [
    { _id: 1, A: ["red", "blue"], B: ["red", "blue"] },
    { _id: 2, A: ["red", "blue"], B: ["blue", "red", "blue"] },
    { _id: 3, A: ["red", "blue"], B: ["red", "blue", "green"] },
    { _id: 4, A: ["red", "blue"], B: ["green", "red"] },
    { _id: 5, A: ["red", "blue"], B: [] },
    { _id: 6, A: ["red", "blue"], B: [["red"], ["blue"]] },
    { _id: 7, A: ["red", "blue"], B: [["red", "blue"]] },
    { _id: 8, A: [], B: [] },
    { _id: 9, A: [], B: ["red"] },
  ];

  // equality
  it("can aggregate with $setEquals", () => {
    const result = aggregate(experiments, [
      {
        $project: {
          A: 1,
          B: 1,
          sameElements: { $setEquals: ["$A", "$B"] },
          _id: 0,
        },
      },
    ]);
    expect(result).toEqual([
      { A: ["red", "blue"], B: ["red", "blue"], sameElements: true },
      { A: ["red", "blue"], B: ["blue", "red", "blue"], sameElements: true },
      { A: ["red", "blue"], B: ["red", "blue", "green"], sameElements: false },
      { A: ["red", "blue"], B: ["green", "red"], sameElements: false },
      { A: ["red", "blue"], B: [], sameElements: false },
      { A: ["red", "blue"], B: [["red"], ["blue"]], sameElements: false },
      { A: ["red", "blue"], B: [["red", "blue"]], sameElements: false },
      { A: [], B: [], sameElements: true },
      { A: [], B: ["red"], sameElements: false },
    ]);
  });

  // intersection
  it("can aggregate with $setIntersection", () => {
    const result = aggregate(experiments, [
      {
        $project: {
          A: 1,
          B: 1,
          commonToBoth: { $setIntersection: ["$A", "$B"] },
          _id: 0,
        },
      },
    ]);
    expect(result).toEqual([
      { A: ["red", "blue"], B: ["red", "blue"], commonToBoth: ["red", "blue"] },
      {
        A: ["red", "blue"],
        B: ["blue", "red", "blue"],
        commonToBoth: ["red", "blue"],
      },
      {
        A: ["red", "blue"],
        B: ["red", "blue", "green"],
        commonToBoth: ["red", "blue"],
      },
      { A: ["red", "blue"], B: ["green", "red"], commonToBoth: ["red"] },
      { A: ["red", "blue"], B: [], commonToBoth: [] },
      { A: ["red", "blue"], B: [["red"], ["blue"]], commonToBoth: [] },
      { A: ["red", "blue"], B: [["red", "blue"]], commonToBoth: [] },
      { A: [], B: [], commonToBoth: [] },
      { A: [], B: ["red"], commonToBoth: [] },
    ]);
  });

  // union
  it("can aggregate with $setUnion", () => {
    const result = aggregate(experiments, [
      {
        $project: {
          A: 1,
          B: 1,
          allValues: { $setUnion: ["$A", "$B"] },
          _id: 0,
        },
      },
    ]);
    expect(result).toEqual([
      { A: ["red", "blue"], B: ["red", "blue"], allValues: ["red", "blue"] },
      {
        A: ["red", "blue"],
        B: ["blue", "red", "blue"],
        allValues: ["red", "blue"],
      },
      {
        A: ["red", "blue"],
        B: ["red", "blue", "green"],
        allValues: ["red", "blue", "green"],
      },
      {
        A: ["red", "blue"],
        B: ["green", "red"],
        allValues: ["red", "blue", "green"],
      },
      { A: ["red", "blue"], B: [], allValues: ["red", "blue"] },
      {
        A: ["red", "blue"],
        B: [["red"], ["blue"]],
        allValues: ["red", "blue", ["red"], ["blue"]],
      },
      {
        A: ["red", "blue"],
        B: [["red", "blue"]],
        allValues: ["red", "blue", ["red", "blue"]],
      },
      { A: [], B: [], allValues: [] },
      { A: [], B: ["red"], allValues: ["red"] },
    ]);
  });

  // difference
  it("can aggregate with $setDifference", () => {
    const result = aggregate(experiments, [
      {
        $project: {
          A: 1,
          B: 1,
          inBOnly: { $setDifference: ["$B", "$A"] },
          _id: 0,
        },
      },
    ]);
    expect(result).toEqual([
      { A: ["red", "blue"], B: ["red", "blue"], inBOnly: [] },
      { A: ["red", "blue"], B: ["blue", "red", "blue"], inBOnly: [] },
      { A: ["red", "blue"], B: ["red", "blue", "green"], inBOnly: ["green"] },
      { A: ["red", "blue"], B: ["green", "red"], inBOnly: ["green"] },
      { A: ["red", "blue"], B: [], inBOnly: [] },
      {
        A: ["red", "blue"],
        B: [["red"], ["blue"]],
        inBOnly: [["red"], ["blue"]],
      },
      { A: ["red", "blue"], B: [["red", "blue"]], inBOnly: [["red", "blue"]] },
      { A: [], B: [], inBOnly: [] },
      { A: [], B: ["red"], inBOnly: ["red"] },
    ]);
  });

  // subset
  it("can aggregate with $setIsSubset", () => {
    const result = aggregate(experiments, [
      {
        $project: {
          A: 1,
          B: 1,
          AisSubset: { $setIsSubset: ["$A", "$B"] },
          _id: 0,
        },
      },
    ]);
    expect(result).toEqual([
      { A: ["red", "blue"], B: ["red", "blue"], AisSubset: true },
      { A: ["red", "blue"], B: ["blue", "red", "blue"], AisSubset: true },
      { A: ["red", "blue"], B: ["red", "blue", "green"], AisSubset: true },
      { A: ["red", "blue"], B: ["green", "red"], AisSubset: false },
      { A: ["red", "blue"], B: [], AisSubset: false },
      { A: ["red", "blue"], B: [["red"], ["blue"]], AisSubset: false },
      { A: ["red", "blue"], B: [["red", "blue"]], AisSubset: false },
      { A: [], B: [], AisSubset: true },
      { A: [], B: ["red"], AisSubset: true },
    ]);
  });

  const surveyData = [
    { _id: 1, responses: [true] },
    { _id: 2, responses: [true, false] },
    { _id: 3, responses: [] },
    { _id: 4, responses: [1, true, "seven"] },
    { _id: 5, responses: [0] },
    { _id: 6, responses: [[]] },
    { _id: 7, responses: [[0]] },
    { _id: 8, responses: [[false]] },
    { _id: 9, responses: [null] },
    { _id: 10, responses: [undefined] },
  ];

  // any element true
  it("can aggregate with $anyElementTrue", () => {
    const result = aggregate(surveyData, [
      {
        $project: {
          responses: 1,
          isAnyTrue: { $anyElementTrue: ["$responses"] },
          _id: 0,
        },
      },
    ]);
    expect(result).toEqual([
      { responses: [true], isAnyTrue: true },
      { responses: [true, false], isAnyTrue: true },
      { responses: [], isAnyTrue: false },
      { responses: [1, true, "seven"], isAnyTrue: true },
      { responses: [0], isAnyTrue: false },
      { responses: [[]], isAnyTrue: true },
      { responses: [[0]], isAnyTrue: true },
      { responses: [[false]], isAnyTrue: true },
      { responses: [null], isAnyTrue: false },
      { responses: [undefined], isAnyTrue: false },
    ]);
  });

  // all elements true
  it("can aggregate with $allElementsTrue", () => {
    const result = aggregate(surveyData, [
      {
        $project: {
          responses: 1,
          isAllTrue: { $allElementsTrue: ["$responses"] },
          _id: 0,
        },
      },
    ]);
    expect(result).toEqual([
      { responses: [true], isAllTrue: true },
      { responses: [true, false], isAllTrue: false },
      { responses: [], isAllTrue: true },
      { responses: [1, true, "seven"], isAllTrue: true },
      { responses: [0], isAllTrue: false },
      { responses: [[]], isAllTrue: true },
      { responses: [[0]], isAllTrue: true },
      { responses: [[false]], isAllTrue: true },
      { responses: [null], isAllTrue: false },
      { responses: [undefined], isAllTrue: false },
    ]);
  });
});
