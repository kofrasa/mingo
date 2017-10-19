var test = require('tape')
var mingo = require('../../dist/mingo')
var runTest = require('./../support').runTest


// hook in custom operator to round value
mingo.addOperators(mingo.OP_EXPRESSION, (_) => {
  return {
    $round: (obj, expr) => {
      var args = _.computeValue(obj, expr)
      var n = args[0].toString()
      var parts = n.toString().split('.')
      return (parts.length > 1)
        ? Number(parts[0] + '.' + parts[1].substr(0, args[1]))
        : n
    }
  }
})

runTest("Arithmetic Operators", {
  $abs: [
    [{ $abs: null },	null],
    [{ $abs: -1 },	1],
    [{ $abs: 1 },	1]
  ],
  $add: [
    [[10, 2], 12],
    [[-1, 5], 4],
    [[-3, -7], -10],
    [[new Date("2017-10-10"), 3*24*60*60000], new Date("2017-10-13")]
  ],
  $ceil: [
    [{ $ceil: NaN }, NaN],
    [{ $ceil: null }, null],
    [{ $ceil: 1 }, 1],
    [{ $ceil: 7.80 },	8],
    [{ $ceil: -2.8 },	-2]
  ],
  $divide: [
    [[80, 4], 20],
    [[1.5, 3], 0.5],
    [[40, 8], 5]
  ],
  $exp: [
    [{ $exp: 0 },	1],
    [{$round: [{ $exp: 2 }, 10]}, 7.3890560989], // applied rounding to survive different v8 versions
    [{$round: [{ $exp: -2 }, 10]}, 0.1353352832],
    [{ $exp: NaN }, NaN],
    [{ $exp: undefined }, null]
  ],
  $floor: [
    [{ $floor: NaN }, NaN],
    [{ $floor: undefined }, null],
    [{ $floor: 1 }, 1],
    [{ $floor: 7.80 }, 7],
    [{ $floor: -2.8 }, -3]
  ],
  $ln: [
    [{ $ln: NaN }, NaN],
    [{ $ln: undefined }, null],
    [{ $ln: 1 },	0],
    [{ $ln: Math.E }, 1],
    [{ $ln: 10  },	2.302585092994046]
  ],
  $log: [
    [{ $log: [NaN, 1] }, NaN],
    [{ $log: [undefined, 2] }, null],
    [{ $log: [ 100, 10 ] },	2],
    [{ $log: [ 100, Math.E ] }, 4.605170185988092]
  ],
  $log10: [
    [{ $log10: NaN }, NaN],
    [{ $log10: undefined }, null],
    [{ $log10: 1 },	0],
    [{ $log10: 10 },	1],
    [{ $log10: 100 },	2],
    [{ $log10: 1000 },	3]
  ],
  $mod: [
    [[80, 7], 3],
    [[40, 4], 0]
  ],
  $multiply: [
    [[5, 10], 50],
    [[-2, 4], -8],
    [[-3, -3], 9]
  ],
  $pow: [
    [{ $pow: [ 0, -1 ] },	'$pow cannot raise 0 to a negative exponent', {err:1}],
    [{ $pow: [ 5, 0 ] },	1],
    [{ $pow: [ 5, 2 ] },	25],
    [{ $pow: [ 5, -2 ] },	0.04],
    [{ $pow: [ -5, 0.5 ] },	NaN]
  ],
  $sqrt: [
    [{ $sqrt: null },	null],
    [{ $sqrt: NaN },	NaN],
    [{ $sqrt: 25 },	5],
    [{ $sqrt: 30 },	5.477225575051661]
  ],
  $subtract: [
    [[-1, -1], 0],
    [[-1, 2], -3],
    [[2, -1], 3]
  ],
  $truc: [
    [{ $trunc: NaN }, NaN],
    [{ $trunc: null }, null],
    [{ $trunc: 0 },	0],
    [{ $trunc: 7.80 }, 7],
    [{ $trunc: -2.3 }, -2]
  ]
})