import * as support from "../../support";

support.runTest("operators/expression/arithmetic", {
  $abs: [
    [{ $abs: null }, null],
    [{ $abs: -1 }, 1],
    [{ $abs: 1 }, 1]
  ],
  $add: [
    [[10, 2], 12],
    [[-1, 5], 4],
    [[-3, -7], -10],
    [[new Date("2017-10-10"), 3 * 24 * 60 * 60000], new Date("2017-10-13")]
  ],
  $ceil: [
    [{ $ceil: NaN }, NaN],
    [{ $ceil: null }, null],
    [{ $ceil: 1 }, 1],
    [{ $ceil: 7.8 }, 8],
    [{ $ceil: -2.8 }, -2]
  ],
  $divide: [
    [[80, 4], 20],
    [[1.5, 3], 0.5],
    [[40, 8], 5]
  ],
  $exp: [
    [{ $exp: 0 }, 1],
    [{ $round: [{ $exp: 2 }, 10] }, 7.3890560989], // applied rounding to survive different v8 versions
    [{ $round: [{ $exp: -2 }, 10] }, 0.1353352832],
    [{ $exp: NaN }, NaN],
    [{ $exp: undefined }, null]
  ],
  $floor: [
    [{ $floor: NaN }, NaN],
    [{ $floor: undefined }, null],
    [{ $floor: 1 }, 1],
    [{ $floor: 7.8 }, 7],
    [{ $floor: -2.8 }, -3]
  ],
  $ln: [
    [{ $ln: NaN }, NaN],
    [{ $ln: undefined }, null],
    [{ $ln: 1 }, 0],
    [{ $ln: Math.E }, 1],
    [{ $ln: 10 }, 2.302585092994046]
  ],
  $log: [
    [{ $log: [NaN, 1] }, NaN],
    [{ $log: [undefined, 2] }, null],
    [{ $log: [100, 10] }, 2],
    [{ $log: [100, Math.E] }, 4.605170185988092]
  ],
  $log10: [
    [{ $log10: NaN }, NaN],
    [{ $log10: undefined }, null],
    [{ $log10: 1 }, 0],
    [{ $log10: 10 }, 1],
    [{ $log10: 100 }, 2],
    [{ $log10: 1000 }, 3]
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
    [
      { $pow: [0, -1] },
      "$pow cannot raise 0 to a negative exponent",
      { err: 1 }
    ],
    [{ $pow: [5, 0] }, 1],
    [{ $pow: [5, 2] }, 25],
    [{ $pow: [5, -2] }, 0.04],
    [{ $pow: [-5, 0.5] }, NaN]
  ],
  $round: [
    [[10.5, 0], 10],
    [[11.5, 0], 12],
    [[12.5, 0], 12],
    [[13.5, 0], 14],
    // rounded to the first decimal place
    [[19.25, 1], 19.2],
    [[28.73, 1], 28.7],
    [[34.32, 1], 34.3],
    [[-45.39, 1], -45.4],
    // rounded using the first digit to the left of the decimal
    [[19.25, -1], 10],
    [[28.73, -1], 20],
    [[34.32, -1], 30],
    [[-45.39, -1], -50],
    // rounded to the whole integer
    [[19.25], 19],
    [[28.73], 29],
    [[34.32], 34],
    [[-45.39], -45],
    [[10.4], 10],
    [[10.6], 11],
    [[10.7], 11],
    [[11.4], 11],
    [[11.9], 12],
    [[19.25, 0], 19],
    [[28.73, 0], 29],
    [[34.32, 0], 34],
    [[-45.39, 0], -45],
    [[1.6016, 3], 1.602],
    [[1.6015, 3], 1.601],
    [[10.4, 0], 10],
    [[10.6, 0], 11],
    [[10.7, 0], 11],
    [[11.4, 0], 11],
    [[11.9, 0], 12]
  ],
  $sqrt: [
    [{ $sqrt: null }, null],
    [{ $sqrt: NaN }, NaN],
    [{ $sqrt: 25 }, 5],
    [{ $sqrt: 30 }, 5.477225575051661]
  ],
  $subtract: [
    [[-1, -1], 0],
    [[-1, 2], -3],
    [[2, -1], 3]
  ],
  $trunc: [
    [[NaN, 0], NaN],
    [[null, 0], null],
    [[NaN, 1], NaN],
    [[null, 1], null],
    [[Infinity, 1], Infinity],
    [[-Infinity, 1], -Infinity],
    [[0, 0], 0],
    // truncate to the first decimal place
    [[19.25, 1], 19.2],
    [[28.73, 1], 28.7],
    [[34.32, 1], 34.3],
    [[-45.39, 1], -45.3],
    // truncated to the first place
    [[19.25, -1], 10],
    [[28.73, -1], 20],
    [[34.32, -1], 30],
    [[-45.39, -1], -40],
    // truncate to the whole integer
    [[19.25], 19],
    [[28.73], 28],
    [[34.32], 34],
    [[-45.39], -45],
    [[19.25, 0], 19],
    [[28.73, 0], 28],
    [[34.32, 0], 34],
    [[-45.39, 0], -45]
  ]
});
