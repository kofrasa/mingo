import * as support from "../support";

support.runTest("Trignometry Operators", {
  $sin: [
    [NaN, NaN],
    [null, null],
    [
      Infinity,
      "cannot apply $sin to -inf, value must in (-inf,inf)",
      { err: true },
    ],
    [Math.PI, 1.2246467991473532e-16],
  ],
  $cos: [
    [NaN, NaN],
    [null, null],
    [
      Infinity,
      "cannot apply $cos to -inf, value must in (-inf,inf)",
      { err: true },
    ],
    [Math.PI, -1],
  ],
  $tan: [
    [NaN, NaN],
    [null, null],
    [
      Infinity,
      "cannot apply $tan to -inf, value must in (-inf,inf)",
      { err: true },
    ],
    [Math.PI, -1.2246467991473532e-16],
  ],
  $asin: [
    [NaN, NaN],
    [null, null],
    [
      Infinity,
      "cannot apply $asin to -inf, value must in (-inf,inf)",
      { err: true },
    ],
    [1, 1.5707963267948966],
  ],
  $acos: [
    [NaN, NaN],
    [null, null],
    [
      Infinity,
      "cannot apply $acos to -inf, value must in (-inf,inf)",
      { err: true },
    ],
    [1, 0],
  ],
  $atan: [
    [NaN, NaN],
    [null, null],
    [
      Infinity,
      "cannot apply $atan to -inf, value must in (-inf,inf)",
      { err: true },
    ],
    [1, 0.7853981633974483],
  ],
  $atan2: [
    [[NaN, 3], NaN],
    [[4, null], null],
    [[1, 1], 0.7853981633974483],
  ],
  $asinh: [
    [NaN, NaN],
    [null, null],
    [
      Infinity,
      "cannot apply $asinh to -inf, value must in (-inf,inf)",
      { err: true },
    ],
    [Math.PI, 1.8622957433108482],
  ],
  $acosh: [
    [NaN, NaN],
    [null, null],
    [
      Infinity,
      "cannot apply $acosh to -inf, value must in (-inf,inf)",
      { err: true },
    ],
    [Math.PI, 1.811526272460853],
  ],
  $atanh: [
    [NaN, NaN],
    [null, null],
    [
      Infinity,
      "cannot apply $atanh to -inf, value must in (-inf,inf)",
      { err: true },
    ],
    [Math.PI - 3, 0.14255044070731132],
  ],
  $degreesToRadians: [
    [NaN, NaN],
    [null, null],
    [Infinity, Infinity],
    [53.13010235415597870314438744090659, 0.927295218001612232428512462922429],
    [36.86989764584402129685561255909341, 0.6435011087932843868028092287173227],
    [90, 1.570796326794896619231321691639752],
  ],
  $radiansToDegrees: [
    [NaN, NaN],
    [null, null],
    [Infinity, Infinity],
    [0.927295218001612232428512462922429, 53.13010235415597870314438744090659],
    [0.6435011087932843868028092287173227, 36.86989764584402129685561255909341],
    [1.570796326794896619231321691639752, 90.0],
  ],
});
