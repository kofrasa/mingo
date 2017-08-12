var test = require('tape')
var mingo = require('../../dist/mingo')
var runTest = require('./../support').runTest

var opt = {err:true}

runTest('String Operators', {
  $concat: [
    [[null, 'abc'], null],
    [['a', '-', 'c'], 'a-c']
  ],

  $indexOfBytes: [
    [['cafeteria', 'e'], 3],
    [['cafétéria', 'é'], 3],
    [['cafétéria', 'e'], -1],
    [['cafétéria', 't'], 4], // "5" is an error in MongoDB docs.
    [['foo.bar.fi', '.', 5], 7],
    [['vanilla', 'll', 0, 2], -1],
    [['vanilla', 'll', -1], '$indexOfBytes third operand must resolve to a non-negative integer', opt], // Error
    [['vanilla', 'll', 12], -1],
    [['vanilla', 'll', 5, 2], -1],
    [['vanilla', 'nilla', 3], -1],
    [[null, 'foo'], null]
  ],

  $split: [
    [[null, '/'], null],
    [['June-15-2013', '-'], ['June', '15', '2013']],
    [['banana split', 'a'], ['b', 'n', 'n', ' split']],
    [['Hello World', ' '], ['Hello', 'World']],
    [['astronomical', 'astro'], ['', 'nomical']],
    [['pea green boat', 'owl'], ['pea green boat']],
    [['headphone jack', 7], '$split requires an expression that evaluates to a string as a second argument, found: number', opt],
    [['headphone jack', /jack/], '$split requires an expression that evaluates to a string as a second argument, found: regex', opt]
  ],

  $strLenBytes: [
    [{ $strLenBytes: "abcde" }, 5],	// Each character is encoded using one byte.
    [{ $strLenBytes: "Hello World!" }, 12], //	Each character is encoded using one byte.
    [{ $strLenBytes: "cafeteria" }, 9], //	Each character is encoded using one byte.
    [{ $strLenBytes: "cafétéria" }, 11], //	é is encoded using two bytes.
    [{ $strLenBytes: "" }, 0],	//Empty strings return 0.
    [{ $strLenBytes: { $literal: "$€λG" } }, 7], // € is encoded using three bytes. λ is encoded using two bytes.
    [{ $strLenBytes: "寿司" }, 6] // Each character is encoded using three bytes.
  ],

  $strLenCP: [
    [{ $strLenCP: "abcde" }, 5],
    [{ $strLenCP: "Hello World!" }, 12],
    [{ $strLenCP: "cafeteria" }, 9],
    [{ $strLenCP: "cafétéria" }, 9],
    [{ $strLenCP: "" }, 0],
    [{ $strLenCP: { $literal: "$€λG" } }, 4],
    [{ $strLenCP: "寿司" }, 2]
  ],

  $strcasecmp: [
    [[null, undefined], 0],
    [['13Q1', '13q4'], -1],
    [['13Q4', '13q4'], 0],
    [['14Q2', '13q4'], 1]
  ],

  $substrCP: [
    [[null, 2], ''],
    [["hello", -1], ''],
    [["hello", 1, -2], 'ello'],
    [{ $substrCP: ["abcde", 1, 2] }, "bc"],
    [{ $substrCP: ["Hello World!", 6, 5] }, "World"],
    [{ $substrCP: ["cafétéria", 0, 5] }, "cafét"],
    [{ $substrCP: ["cafétéria", 5, 4] }, "tér"],
    [{ $substrCP: ["cafétéria", 7, 3] }, "ia"],
    [{ $substrCP: ["cafétéria", 3, 1] }, "é"]
  ],

  $substrBytes: [
    [{ $substrBytes: [ "abcde", 1, 2 ] },	"bc"],
    [{ $substrBytes: [ "Hello World!", 6, 5 ] }, "World"],
    [{ $substrBytes: [ "cafétéria", 0, 5 ] },	"café"],
    [{ $substrBytes: [ "cafétéria", 5, 4 ] },	"tér"],
    [{ $substrBytes: [ "cafétéria", 7, 3 ] },	"invalid range", {err:1}],
    [{ $substrBytes: [ "cafétéria", 3, 1 ] },	"invalid range", {err:1}]
  ],

  $toLower: [
    ['ABC123', 'abc123']
  ],

  $toUpper: [
    ['abc123', 'ABC123']
  ]

})