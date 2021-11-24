import * as support from "../../support";

const opt = { err: true };

support.runTest("operators/expression/string", {
  $concat: [
    [[null, "abc"], null],
    [["a", "-", "c"], "a-c"],
  ],

  $indexOfBytes: [
    [["cafeteria", "e"], 3],
    [["cafétéria", "é"], 3],
    [["cafétéria", "e"], -1],
    [["cafétéria", "t"], 4], // "5" is an error in MongoDB docs.
    [["foo.bar.fi", ".", 5], 7],
    [["vanilla", "ll", 0, 2], -1],
    [
      ["vanilla", "ll", -1],
      "$indexOfBytes third operand must resolve to a non-negative integer",
      opt,
    ], // Error
    [["vanilla", "ll", 12], -1],
    [["vanilla", "ll", 5, 2], -1],
    [["vanilla", "nilla", 3], -1],
    [[null, "foo"], null],
  ],

  $split: [
    [[null, "/"], null],
    [
      ["June-15-2013", "-"],
      ["June", "15", "2013"],
    ],
    [
      ["banana split", "a"],
      ["b", "n", "n", " split"],
    ],
    [
      ["Hello World", " "],
      ["Hello", "World"],
    ],
    [
      ["astronomical", "astro"],
      ["", "nomical"],
    ],
    [["pea green boat", "owl"], ["pea green boat"]],
    [
      ["headphone jack", 7],
      "$split requires an expression that evaluates to a string as a second argument, found: number",
      opt,
    ],
    [
      ["headphone jack", /jack/],
      "$split requires an expression that evaluates to a string as a second argument, found: regex",
      opt,
    ],
  ],

  $strLenBytes: [
    [{ $strLenBytes: "abcde" }, 5], // Each character is encoded using one byte.
    [{ $strLenBytes: "Hello World!" }, 12], //	Each character is encoded using one byte.
    [{ $strLenBytes: "cafeteria" }, 9], //	Each character is encoded using one byte.
    [{ $strLenBytes: "cafétéria" }, 11], //	é is encoded using two bytes.
    [{ $strLenBytes: "" }, 0], //Empty strings return 0.
    [{ $strLenBytes: { $literal: "$€λG" } }, 7], // € is encoded using three bytes. λ is encoded using two bytes.
    [{ $strLenBytes: "寿司" }, 6], // Each character is encoded using three bytes.
  ],

  $strLenCP: [
    [{ $strLenCP: "abcde" }, 5],
    [{ $strLenCP: "Hello World!" }, 12],
    [{ $strLenCP: "cafeteria" }, 9],
    [{ $strLenCP: "cafétéria" }, 9],
    [{ $strLenCP: "" }, 0],
    [{ $strLenCP: { $literal: "$€λG" } }, 4],
    [{ $strLenCP: "寿司" }, 2],
  ],

  $strcasecmp: [
    [[null, undefined], 0],
    [["13Q1", "13q4"], -1],
    [["13Q4", "13q4"], 0],
    [["14Q2", "13q4"], 1],
  ],

  $substrCP: [
    [[null, 2], ""],
    [["hello", -1], ""],
    [["hello", 1, -2], "ello"],
    [{ $substrCP: ["abcde", 1, 2] }, "bc"],
    [{ $substrCP: ["Hello World!", 6, 5] }, "World"],
    [{ $substrCP: ["cafétéria", 0, 5] }, "cafét"],
    [{ $substrCP: ["cafétéria", 5, 4] }, "éria"],
    [{ $substrCP: ["cafétéria", 7, 3] }, "ia"],
    [{ $substrCP: ["cafétéria", 3, 1] }, "é"],
  ],

  $substrBytes: [
    [{ $substrBytes: ["abcde", 1, 2] }, "bc"],
    [{ $substrBytes: ["Hello World!", 6, 5] }, "World"],
    [{ $substrBytes: ["cafétéria", 0, 5] }, "café"],
    [{ $substrBytes: ["cafétéria", 5, 4] }, "tér"],
    [{ $substrBytes: ["cafétéria", 7, 3] }, "invalid range", { err: 1 }],
    [{ $substrBytes: ["cafétéria", 3, 1] }, "invalid range", { err: 1 }],
    [["éclair", 0, 3], "éc"],
    [["jalapeño", 0, 3], "jal"],
    [["寿司sushi", 0, 3], "寿"],
  ],

  $toLower: [["ABC123", "abc123"]],

  $toUpper: [["abc123", "ABC123"]],

  $trim: [
    [{ $trim: { input: "  \n good  bye \t  " } }, "good  bye"],
    [{ $trim: { input: " ggggoodbyeeeee", chars: "ge" } }, " ggggoodby"],
    [{ $trim: { input: "    ggggoodbyeeeee", chars: " ge" } }, "oodby"],
    [{ $trim: { input: null } }, null],
  ],

  $ltrim: [
    [{ $ltrim: { input: "  \n good  bye \t  " } }, "good  bye \t  "],
    [{ $ltrim: { input: " ggggoodbyeeeee", chars: "ge" } }, " ggggoodbyeeeee"],
    [{ $ltrim: { input: "    ggggoodbyeeeee ", chars: " gd" } }, "oodbyeeeee "],
    [{ $ltrim: { input: null } }, null],
  ],

  $rtrim: [
    [{ $rtrim: { input: "  \n good  bye \t  " } }, "  \n good  bye"],
    [{ $rtrim: { input: " ggggoodbyeeeee", chars: "ge" } }, " ggggoodby"],
    [{ $rtrim: { input: " ggggoodbyeeeee    ", chars: "e " } }, " ggggoodby"],
    [{ $rtrim: { input: null } }, null],
  ],

  $replaceOne: [
    [{ input: null, find: "abc", replacement: "ABC" }, null],
    [{ input: "abc", find: null, replacement: "ABC" }, null],
    [{ input: "abc", find: "abc", replacement: null }, null],
  ],

  $replaceAll: [
    [{ input: null, find: "abc", replacement: "ABC" }, null],
    [{ input: "abc", find: null, replacement: "ABC" }, null],
    [{ input: "abc", find: "abc", replacement: null }, null],
  ],
});

const data = [
  { _id: 1, fname: "Carol", lname: "Smith", phone: "718-555-0113" },
  { _id: 2, fname: "Daryl", lname: "Doe", phone: "212-555-8832" },
  { _id: 3, fname: "Polly", lname: "Andrews", phone: "208-555-1932" },
  { _id: 4, fname: "Colleen", lname: "Duncan", phone: "775-555-0187" },
  { _id: 5, fname: "Luna", lname: "Clarke", phone: "917-555-4414" },
];

const productsData = [
  { _id: 1, description: "Single LINE description." },
  { _id: 2, description: "First lines\nsecond line" },
  { _id: 3, description: "Many spaces before     line" },
  { _id: 4, description: "Multiple\nline descriptions" },
  { _id: 5, description: "anchors, links and hyperlinks" },
  { _id: 6, description: "métier work vocation" },
];

support.runTestPipeline("$regexMatch operators", [
  {
    message: "$regexMatch with option 's'",
    input: productsData,
    pipeline: [
      {
        $addFields: {
          returns: {
            $regexMatch: {
              input: "$description",
              regex: /m.*line/,
              options: "si",
            },
          },
        },
      },
    ],
    expected: [
      { _id: 1, description: "Single LINE description.", returns: false },
      { _id: 2, description: "First lines\nsecond line", returns: false },
      { _id: 3, description: "Many spaces before     line", returns: true },
      { _id: 4, description: "Multiple\nline descriptions", returns: true },
      { _id: 5, description: "anchors, links and hyperlinks", returns: false },
      { _id: 6, description: "métier work vocation", returns: false },
    ],
  },
]);

support.runTestPipeline("$regexFind operators", [
  {
    message: "can apply $regexFind",
    input: [
      { _id: 1, category: "café" },
      { _id: 2, category: "cafe" },
      { _id: 3, category: "cafE" },
    ],
    pipeline: [
      {
        $addFields: {
          resultObject: { $regexFind: { input: "$category", regex: /cafe/ } },
        },
      },
    ],
    expected: [
      { _id: 1, category: "café", resultObject: null },
      {
        _id: 2,
        category: "cafe",
        resultObject: { match: "cafe", idx: 0, captures: [] },
      },
      { _id: 3, category: "cafE", resultObject: null },
    ],
  },

  {
    message: "$regexFind with 'captures': 1",
    input: data,
    pipeline: [
      {
        $project: {
          returnObject: {
            $regexFind: { input: "$fname", regex: /(C(ar)*)ol/ },
          },
        },
      },
    ],
    expected: [
      {
        _id: 1,
        returnObject: { match: "Carol", idx: 0, captures: ["Car", "ar"] },
      },
      { _id: 2, returnObject: null },
      { _id: 3, returnObject: null },
      { _id: 4, returnObject: { match: "Col", idx: 0, captures: ["C", null] } },
      { _id: 5, returnObject: null },
    ],
  },

  {
    message: "$regexFind with 'captures': 2",
    input: data,
    pipeline: [
      {
        $project: {
          nycContacts: {
            $regexFind: {
              input: "$phone",
              regex: /^(718).*|^(212).*|^(917).*/,
            },
          },
        },
      },
    ],
    expected: [
      {
        _id: 1,
        nycContacts: {
          match: "718-555-0113",
          idx: 0,
          captures: ["718", null, null],
        },
      },
      {
        _id: 2,
        nycContacts: {
          match: "212-555-8832",
          idx: 0,
          captures: [null, "212", null],
        },
      },
      { _id: 3, nycContacts: null },
      { _id: 4, nycContacts: null },
      {
        _id: 5,
        nycContacts: {
          match: "917-555-4414",
          idx: 0,
          captures: [null, null, "917"],
        },
      },
    ],
  },

  {
    message: "$regexFind without grouping",
    input: productsData,
    pipeline: [
      {
        $addFields: {
          returnObject: {
            $regexFind: { input: "$description", regex: /line/ },
          },
        },
      },
    ],
    expected: [
      { _id: 1, description: "Single LINE description.", returnObject: null },
      {
        _id: 2,
        description: "First lines\nsecond line",
        returnObject: { match: "line", idx: 6, captures: [] },
      },
      {
        _id: 3,
        description: "Many spaces before     line",
        returnObject: { match: "line", idx: 23, captures: [] },
      },
      {
        _id: 4,
        description: "Multiple\nline descriptions",
        returnObject: { match: "line", idx: 9, captures: [] },
      },
      {
        _id: 5,
        description: "anchors, links and hyperlinks",
        returnObject: null,
      },
      { _id: 6, description: "métier work vocation", returnObject: null },
    ],
  },

  {
    message: "$regexFind with grouping",
    input: productsData,
    pipeline: [
      {
        $addFields: {
          returnObject: {
            $regexFind: { input: "$description", regex: /lin(e|k)/ },
          },
        },
      },
    ],
    expected: [
      { _id: 1, description: "Single LINE description.", returnObject: null },
      {
        _id: 2,
        description: "First lines\nsecond line",
        returnObject: { match: "line", idx: 6, captures: ["e"] },
      },
      {
        _id: 3,
        description: "Many spaces before     line",
        returnObject: { match: "line", idx: 23, captures: ["e"] },
      },
      {
        _id: 4,
        description: "Multiple\nline descriptions",
        returnObject: { match: "line", idx: 9, captures: ["e"] },
      },
      {
        _id: 5,
        description: "anchors, links and hyperlinks",
        returnObject: { match: "link", idx: 9, captures: ["k"] },
      },
      { _id: 6, description: "métier work vocation", returnObject: null },
    ],
  },

  {
    message: "$regexFind 'idx' is codepoint",
    input: productsData,
    pipeline: [
      {
        $addFields: {
          returnObject: {
            $regexFind: { input: "$description", regex: /tier/ },
          },
        },
      },
    ],
    expected: [
      { _id: 1, description: "Single LINE description.", returnObject: null },
      { _id: 2, description: "First lines\nsecond line", returnObject: null },
      {
        _id: 3,
        description: "Many spaces before     line",
        returnObject: null,
      },
      {
        _id: 4,
        description: "Multiple\nline descriptions",
        returnObject: null,
      },
      {
        _id: 5,
        description: "anchors, links and hyperlinks",
        returnObject: null,
      },
      {
        _id: 6,
        description: "métier work vocation",
        returnObject: { match: "tier", idx: 2, captures: [] },
      },
    ],
  },

  {
    message: "$regexFind with option 'i'",
    input: productsData,
    pipeline: [
      {
        $addFields: {
          returnObject: {
            $regexFind: { input: "$description", regex: "line", options: "i" },
          },
        },
      },
    ],
    expected: [
      {
        _id: 1,
        description: "Single LINE description.",
        returnObject: { match: "LINE", idx: 7, captures: [] },
      },
      {
        _id: 2,
        description: "First lines\nsecond line",
        returnObject: { match: "line", idx: 6, captures: [] },
      },
      {
        _id: 3,
        description: "Many spaces before     line",
        returnObject: { match: "line", idx: 23, captures: [] },
      },
      {
        _id: 4,
        description: "Multiple\nline descriptions",
        returnObject: { match: "line", idx: 9, captures: [] },
      },
      {
        _id: 5,
        description: "anchors, links and hyperlinks",
        returnObject: null,
      },
      { _id: 6, description: "métier work vocation", returnObject: null },
    ],
  },

  {
    message: "$regexFind with option 'm'",
    input: productsData,
    pipeline: [
      {
        $addFields: {
          returnObject: {
            $regexFind: { input: "$description", regex: /^s/im },
          },
        },
      },
    ],
    expected: [
      {
        _id: 1,
        description: "Single LINE description.",
        returnObject: { match: "S", idx: 0, captures: [] },
      },
      {
        _id: 2,
        description: "First lines\nsecond line",
        returnObject: { match: "s", idx: 12, captures: [] },
      },
      {
        _id: 3,
        description: "Many spaces before     line",
        returnObject: null,
      },
      {
        _id: 4,
        description: "Multiple\nline descriptions",
        returnObject: null,
      },
      {
        _id: 5,
        description: "anchors, links and hyperlinks",
        returnObject: null,
      },
      { _id: 6, description: "métier work vocation", returnObject: null },
    ],
  },

  {
    message: "$regexFind with option 's'",
    input: productsData,
    pipeline: [
      {
        $addFields: {
          returnObject: {
            $regexFind: {
              input: "$description",
              regex: /m.*line/,
              options: "si",
            },
          },
        },
      },
    ],
    expected: [
      { _id: 1, description: "Single LINE description.", returnObject: null },
      { _id: 2, description: "First lines\nsecond line", returnObject: null },
      {
        _id: 3,
        description: "Many spaces before     line",
        returnObject: {
          match: "Many spaces before     line",
          idx: 0,
          captures: [],
        },
      },
      {
        _id: 4,
        description: "Multiple\nline descriptions",
        returnObject: { match: "Multiple\nline", idx: 0, captures: [] },
      },
      {
        _id: 5,
        description: "anchors, links and hyperlinks",
        returnObject: null,
      },
      { _id: 6, description: "métier work vocation", returnObject: null },
    ],
  },

  // Not supported
  // {
  //   message: "$regexFind with option 'x'",
  //   input: dataForOptions,
  //   pipeline: [ { $addFields: { returnObject: { $regexFind: { input: "$description", regex: /lin(e|k) # matches line or link/, options: "x" } } } } ],
  //   check: [
  //     { "_id" : 1, "description" : "Single LINE description.", "returnObject" : null },
  //     { "_id" : 2, "description" : "First lines\nsecond line", "returnObject" : null },
  //     { "_id" : 3, "description" : "Many spaces before     line", "returnObject" : { "match" : "Many spaces before     line", "idx" : 0, "captures" : [ ] } },
  //     { "_id" : 4, "description" : "Multiple\nline descriptions", "returnObject" : { "match" : "Multiple\nline", "idx" : 0, "captures" : [ ] } },
  //     { "_id" : 5, "description" : "anchors, links and hyperlinks", "returnObject" : null },
  //     { "_id" : 6, "description" : "métier work vocation", "returnObject" : null }
  //   ]
  // }

  {
    message: "$regexFind to Parse Email from String",
    input: [
      {
        _id: 1,
        comment:
          "Hi, I'm just reading about MongoDB -- aunt.arc.tica@example.com",
      },
      { _id: 2, comment: "I wanted to concatenate a string" },
      {
        _id: 3,
        comment:
          "I can't find how to convert a date to string. cam@mongodb.com",
      },
      { _id: 4, comment: "It's just me. I'm testing.  fred@MongoDB.com" },
    ],
    pipeline: [
      {
        $addFields: {
          email: {
            $regexFind: {
              input: "$comment",
              regex: /[a-z0-9_.+-]+@[a-z0-9_.+-]+\.[a-z0-9_.+-]+/i,
            },
          },
        },
      },
      { $set: { email: "$email.match" } },
    ],
    expected: [
      {
        _id: 1,
        comment:
          "Hi, I'm just reading about MongoDB -- aunt.arc.tica@example.com",
        email: "aunt.arc.tica@example.com",
      },
      { _id: 2, comment: "I wanted to concatenate a string" },
      {
        _id: 3,
        comment:
          "I can't find how to convert a date to string. cam@mongodb.com",
        email: "cam@mongodb.com",
      },
      {
        _id: 4,
        comment: "It's just me. I'm testing.  fred@MongoDB.com",
        email: "fred@MongoDB.com",
      },
    ],
  },

  {
    message: "$regexFind to String Elements of an Array",
    input: [
      {
        _id: 1,
        name: "Aunt Arc Tikka",
        details: ["+672-19-9999", "aunt.arc.tica@example.com"],
      },
      {
        _id: 2,
        name: "Belle Gium",
        details: ["+32-2-111-11-11", "belle.gium@example.com"],
      },
      {
        _id: 3,
        name: "Cam Bo Dia",
        details: ["+855-012-000-0000", "cam.bo.dia@example.com"],
      },
      { _id: 4, name: "Fred", details: ["+1-111-222-3333"] },
    ],
    pipeline: [
      { $unwind: "$details" },
      {
        $addFields: {
          regexemail: {
            $regexFind: {
              input: "$details",
              regex: /^[a-z0-9_.+-]+@[a-z0-9_.+-]+\.[a-z0-9_.+-]+$/,
              options: "i",
            },
          },
          regexphone: {
            $regexFind: {
              input: "$details",
              regex: /^[+]{0,1}[0-9]*-?[0-9_-]+$/,
            },
          },
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          details: { email: "$regexemail.match", phone: "$regexphone.match" },
        },
      },
      {
        $group: {
          _id: "$_id",
          name: { $first: "$name" },
          details: { $mergeObjects: "$details" },
        },
      },
      { $sort: { _id: 1 } },
    ],
    expected: [
      {
        _id: 1,
        name: "Aunt Arc Tikka",
        details: { phone: "+672-19-9999", email: "aunt.arc.tica@example.com" },
      },
      {
        _id: 2,
        name: "Belle Gium",
        details: { phone: "+32-2-111-11-11", email: "belle.gium@example.com" },
      },
      {
        _id: 3,
        name: "Cam Bo Dia",
        details: {
          phone: "+855-012-000-0000",
          email: "cam.bo.dia@example.com",
        },
      },
      { _id: 4, name: "Fred", details: { phone: "+1-111-222-3333" } },
    ],
  },

  {
    message: "$regexFind: Use Captured Groupings to Parse User Name",
    input: [
      { _id: 1, name: "Aunt Arc Tikka", email: "aunt.tica@example.com" },
      { _id: 2, name: "Belle Gium", email: "belle.gium@example.com" },
      { _id: 3, name: "Cam Bo Dia", email: "cam.dia@example.com" },
      { _id: 4, name: "Fred" },
    ],
    pipeline: [
      {
        $addFields: {
          username: {
            $regexFind: {
              input: "$email",
              regex: /^([a-z0-9_.+-]+)@[a-z0-9_.+-]+\.[a-z0-9_.+-]+$/,
              options: "i",
            },
          },
        },
      },
      { $set: { username: { $arrayElemAt: ["$username.captures", 0] } } },
    ],
    expected: [
      {
        _id: 1,
        name: "Aunt Arc Tikka",
        email: "aunt.tica@example.com",
        username: "aunt.tica",
      },
      {
        _id: 2,
        name: "Belle Gium",
        email: "belle.gium@example.com",
        username: "belle.gium",
      },
      {
        _id: 3,
        name: "Cam Bo Dia",
        email: "cam.dia@example.com",
        username: "cam.dia",
      },
      { _id: 4, name: "Fred", username: null },
    ],
  },
]);

support.runTestPipeline("$regexFindAll operator", [
  {
    message: "can apply $regexFindAll",
    input: [
      { _id: 1, category: "café" },
      { _id: 2, category: "cafe" },
      { _id: 3, category: "cafE" },
    ],
    pipeline: [
      {
        $addFields: {
          resultObject: {
            $regexFindAll: { input: "$category", regex: /cafe/ },
          },
        },
      },
    ],
    expected: [
      { _id: 1, category: "café", resultObject: [] },
      {
        _id: 2,
        category: "cafe",
        resultObject: [{ match: "cafe", idx: 0, captures: [] }],
      },
      { _id: 3, category: "cafE", resultObject: [] },
    ],
  },

  {
    message: "$regexFindAll with 'captures': 1",
    input: data,
    pipeline: [
      {
        $project: {
          returnObject: {
            $regexFindAll: { input: "$fname", regex: /(C(ar)*)ol/ },
          },
        },
      },
    ],
    expected: [
      {
        _id: 1,
        returnObject: [{ match: "Carol", idx: 0, captures: ["Car", "ar"] }],
      },
      { _id: 2, returnObject: [] },
      { _id: 3, returnObject: [] },
      {
        _id: 4,
        returnObject: [{ match: "Col", idx: 0, captures: ["C", null] }],
      },
      { _id: 5, returnObject: [] },
    ],
  },

  {
    message: "$regexFindAll with 'captures': 2",
    input: data,
    pipeline: [
      {
        $project: {
          nycContacts: {
            $regexFindAll: {
              input: "$phone",
              regex: /^(718).*|^(212).*|^(917).*/,
            },
          },
        },
      },
    ],
    expected: [
      {
        _id: 1,
        nycContacts: [
          { match: "718-555-0113", idx: 0, captures: ["718", null, null] },
        ],
      },
      {
        _id: 2,
        nycContacts: [
          { match: "212-555-8832", idx: 0, captures: [null, "212", null] },
        ],
      },
      { _id: 3, nycContacts: [] },
      { _id: 4, nycContacts: [] },
      {
        _id: 5,
        nycContacts: [
          { match: "917-555-4414", idx: 0, captures: [null, null, "917"] },
        ],
      },
    ],
  },

  {
    message: "$regexFindAll without grouping",
    input: productsData,
    pipeline: [
      {
        $addFields: {
          returnObject: {
            $regexFindAll: { input: "$description", regex: /line/ },
          },
        },
      },
    ],
    expected: [
      { _id: 1, description: "Single LINE description.", returnObject: [] },
      {
        _id: 2,
        description: "First lines\nsecond line",
        returnObject: [
          { match: "line", idx: 6, captures: [] },
          { match: "line", idx: 19, captures: [] },
        ],
      },
      {
        _id: 3,
        description: "Many spaces before     line",
        returnObject: [{ match: "line", idx: 23, captures: [] }],
      },
      {
        _id: 4,
        description: "Multiple\nline descriptions",
        returnObject: [{ match: "line", idx: 9, captures: [] }],
      },
      {
        _id: 5,
        description: "anchors, links and hyperlinks",
        returnObject: [],
      },
      { _id: 6, description: "métier work vocation", returnObject: [] },
    ],
  },

  {
    message: "$regexFindAll with grouping",
    input: productsData,
    pipeline: [
      {
        $addFields: {
          returnObject: {
            $regexFindAll: { input: "$description", regex: /lin(e|k)/ },
          },
        },
      },
    ],
    expected: [
      { _id: 1, description: "Single LINE description.", returnObject: [] },
      {
        _id: 2,
        description: "First lines\nsecond line",
        returnObject: [
          { match: "line", idx: 6, captures: ["e"] },
          { match: "line", idx: 19, captures: ["e"] },
        ],
      },
      {
        _id: 3,
        description: "Many spaces before     line",
        returnObject: [{ match: "line", idx: 23, captures: ["e"] }],
      },
      {
        _id: 4,
        description: "Multiple\nline descriptions",
        returnObject: [{ match: "line", idx: 9, captures: ["e"] }],
      },
      {
        _id: 5,
        description: "anchors, links and hyperlinks",
        returnObject: [
          { match: "link", idx: 9, captures: ["k"] },
          { match: "link", idx: 24, captures: ["k"] },
        ],
      },
      { _id: 6, description: "métier work vocation", returnObject: [] },
    ],
  },

  {
    message: "$regexFindAll 'idx' is codepoint",
    input: productsData,
    pipeline: [
      {
        $addFields: {
          returnObject: {
            $regexFindAll: { input: "$description", regex: /tier/ },
          },
        },
      },
    ],
    expected: [
      { _id: 1, description: "Single LINE description.", returnObject: [] },
      { _id: 2, description: "First lines\nsecond line", returnObject: [] },
      { _id: 3, description: "Many spaces before     line", returnObject: [] },
      { _id: 4, description: "Multiple\nline descriptions", returnObject: [] },
      {
        _id: 5,
        description: "anchors, links and hyperlinks",
        returnObject: [],
      },
      {
        _id: 6,
        description: "métier work vocation",
        returnObject: [{ match: "tier", idx: 2, captures: [] }],
      },
    ],
  },

  {
    message: "$regexFindAll with option 'i'",
    input: productsData,
    pipeline: [
      {
        $addFields: {
          returnObject: {
            $regexFindAll: {
              input: "$description",
              regex: "line",
              options: "i",
            },
          },
        },
      },
    ],
    expected: [
      {
        _id: 1,
        description: "Single LINE description.",
        returnObject: [{ match: "LINE", idx: 7, captures: [] }],
      },
      {
        _id: 2,
        description: "First lines\nsecond line",
        returnObject: [
          { match: "line", idx: 6, captures: [] },
          { match: "line", idx: 19, captures: [] },
        ],
      },
      {
        _id: 3,
        description: "Many spaces before     line",
        returnObject: [{ match: "line", idx: 23, captures: [] }],
      },
      {
        _id: 4,
        description: "Multiple\nline descriptions",
        returnObject: [{ match: "line", idx: 9, captures: [] }],
      },
      {
        _id: 5,
        description: "anchors, links and hyperlinks",
        returnObject: [],
      },
      { _id: 6, description: "métier work vocation", returnObject: [] },
    ],
  },

  {
    message: "$regexFindAll with option 'm'",
    input: productsData,
    pipeline: [
      {
        $addFields: {
          returnObject: {
            $regexFindAll: { input: "$description", regex: /^s/im },
          },
        },
      },
    ],
    expected: [
      {
        _id: 1,
        description: "Single LINE description.",
        returnObject: [{ match: "S", idx: 0, captures: [] }],
      },
      {
        _id: 2,
        description: "First lines\nsecond line",
        returnObject: [{ match: "s", idx: 12, captures: [] }],
      },
      { _id: 3, description: "Many spaces before     line", returnObject: [] },
      { _id: 4, description: "Multiple\nline descriptions", returnObject: [] },
      {
        _id: 5,
        description: "anchors, links and hyperlinks",
        returnObject: [],
      },
      { _id: 6, description: "métier work vocation", returnObject: [] },
    ],
  },

  {
    message: "$regexFindAll with option 's'",
    input: productsData,
    pipeline: [
      {
        $addFields: {
          returnObject: {
            $regexFindAll: {
              input: "$description",
              regex: /m.*line/,
              options: "si",
            },
          },
        },
      },
    ],
    expected: [
      { _id: 1, description: "Single LINE description.", returnObject: [] },
      { _id: 2, description: "First lines\nsecond line", returnObject: [] },
      {
        _id: 3,
        description: "Many spaces before     line",
        returnObject: [
          { match: "Many spaces before     line", idx: 0, captures: [] },
        ],
      },
      {
        _id: 4,
        description: "Multiple\nline descriptions",
        returnObject: [{ match: "Multiple\nline", idx: 0, captures: [] }],
      },
      {
        _id: 5,
        description: "anchors, links and hyperlinks",
        returnObject: [],
      },
      { _id: 6, description: "métier work vocation", returnObject: [] },
    ],
  },

  // Not supported
  // {
  //   message: "$regexFindAll with option 'x'",
  //   input: dataForOptions,
  //   pipeline: [ { $addFields: { returnObject: { $regexFindAll: { input: "$description", regex: /lin(e|k) # matches line or link/, options: "x" } } } } ],
  //   check: [
  //     { "_id" : 1, "description" : "Single LINE description.", "returnObject" : [] },
  //     { "_id" : 2, "description" : "First lines\nsecond line", "returnObject" : [ { "match" : "line", "idx" : 6, "captures" : [ "e" ] }, { "match" : "line", "idx" : 19, "captures" : [ "e" ] } ] },
  //     { "_id" : 3, "description" : "Many spaces before     line", "returnObject" : [ { "match" : "line", "idx" : 23, "captures" : [ "e" ] } ] },
  //     { "_id" : 4, "description" : "Multiple\nline descriptions", "returnObject" : [ { "match" : "line", "idx" : 9, "captures" : [ "e" ] } ] },
  //     { "_id" : 5, "description" : "anchors, links and hyperlinks", "returnObject" : [ { "match" : "link", "idx" : 9, "captures" : [ "k" ] }, { "match" : "link", "idx" : 24, "captures" : [ "k" ] } ] },
  //     { "_id" : 6, "description" : "métier work vocation", "returnObject" : [] }
  //   ]
  // }

  {
    message: "$regexFindAll to Parse Email from String",
    input: [
      {
        _id: 1,
        comment:
          "Hi, I'm just reading about MongoDB -- aunt.arc.tica@example.com",
      },
      { _id: 2, comment: "I wanted to concatenate a string" },
      {
        _id: 3,
        comment:
          "How do I convert a date to string? Contact me at either cam@mongodb.com or c.dia@mongodb.com",
      },
      { _id: 4, comment: "It's just me. I'm testing.  fred@MongoDB.com" },
    ],
    pipeline: [
      {
        $addFields: {
          email: {
            $regexFindAll: {
              input: "$comment",
              regex: /[a-z0-9_.+-]+@[a-z0-9_.+-]+\.[a-z0-9_.+-]+/i,
            },
          },
        },
      },
      { $set: { email: "$email.match" } },
    ],
    expected: [
      {
        _id: 1,
        comment:
          "Hi, I'm just reading about MongoDB -- aunt.arc.tica@example.com",
        email: ["aunt.arc.tica@example.com"],
      },
      { _id: 2, comment: "I wanted to concatenate a string", email: [] },
      {
        _id: 3,
        comment:
          "How do I convert a date to string? Contact me at either cam@mongodb.com or c.dia@mongodb.com",
        email: ["cam@mongodb.com", "c.dia@mongodb.com"],
      },
      {
        _id: 4,
        comment: "It's just me. I'm testing.  fred@MongoDB.com",
        email: ["fred@MongoDB.com"],
      },
    ],
  },

  {
    message: "$regexFindAll: Use Captured Groupings to Parse User Name",
    input: [
      {
        _id: 1,
        comment:
          "Hi, I'm just reading about MongoDB -- aunt.arc.tica@example.com",
      },
      { _id: 2, comment: "I wanted to concatenate a string" },
      {
        _id: 3,
        comment:
          "How do I convert a date to string? Contact me at either cam@mongodb.com or c.dia@mongodb.com",
      },
      { _id: 4, comment: "It's just me. I'm testing.  fred@MongoDB.com" },
    ],
    pipeline: [
      {
        $addFields: {
          names: {
            $regexFindAll: {
              input: "$comment",
              regex: /([a-z0-9_.+-]+)@[a-z0-9_.+-]+\.[a-z0-9_.+-]+/i,
            },
          },
        },
      },
      {
        $set: {
          names: {
            $reduce: {
              input: "$names.captures",
              initialValue: [],
              in: { $concatArrays: ["$$value", "$$this"] },
            },
          },
        },
      },
    ],
    expected: [
      {
        _id: 1,
        comment:
          "Hi, I'm just reading about MongoDB -- aunt.arc.tica@example.com",
        names: ["aunt.arc.tica"],
      },
      { _id: 2, comment: "I wanted to concatenate a string", names: [] },
      {
        _id: 3,
        comment:
          "How do I convert a date to string? Contact me at either cam@mongodb.com or c.dia@mongodb.com",
        names: ["cam", "c.dia"],
      },
      {
        _id: 4,
        comment: "It's just me. I'm testing.  fred@MongoDB.com",
        names: ["fred"],
      },
    ],
  },
]);

support.runTestPipeline("$replaceOne: More examples", [
  {
    message: "$replaceOne",
    input: [
      { _id: 1, item: "blue paint" },
      { _id: 2, item: "blue and green paint" },
      { _id: 3, item: "blue paint with blue paintbrush" },
      { _id: 4, item: "blue paint with green paintbrush" },
    ],
    pipeline: [
      {
        $project: {
          item: {
            $replaceOne: {
              input: "$item",
              find: "blue paint",
              replacement: "red paint",
            },
          },
        },
      },
    ],
    expected: [
      { _id: 1, item: "red paint" },
      { _id: 2, item: "blue and green paint" },
      { _id: 3, item: "red paint with blue paintbrush" },
      { _id: 4, item: "red paint with green paintbrush" },
    ],
  },
]);

support.runTestPipeline("$replaceAll: More examples", [
  {
    message: "$replaceAll",
    input: [
      { _id: 1, item: "blue paint" },
      { _id: 2, item: "blue and green paint" },
      { _id: 3, item: "blue paint with blue paintbrush" },
      { _id: 4, item: "blue paint with green paintbrush" },
    ],
    pipeline: [
      {
        $project: {
          item: {
            $replaceAll: {
              input: "$item",
              find: "blue paint",
              replacement: "red paint",
            },
          },
        },
      },
    ],
    expected: [
      { _id: 1, item: "red paint" },
      { _id: 2, item: "blue and green paint" },
      { _id: 3, item: "red paint with red paintbrush" },
      { _id: 4, item: "red paint with green paintbrush" },
    ],
  },
]);
