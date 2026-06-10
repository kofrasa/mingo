import * as support from "../../support";

support.runTest("operators/expression/string", {
  $concat: [
    ["not an array", Error("expects array")],
    [["a", 1], Error("array of string")],
    [["a", 1], null, { failOnError: false }],
    [[], ""],
    [[null, "abc"], null],
    [["a", "-", "c"], "a-c"]
  ],

  $indexOfBytes: [
    [[0, "2"], Error("arg1 <string>")],
    [["s", 0], Error("arg2 <search>")],
    [["s", "s", -1], Error("arg3 <start>")],
    [["s", "s", 0, -1], Error("arg4 <end>")],
    [["cafeteria", "e"], 3],
    [["cafétéria", "é"], 3],
    [["cafétéria", "e"], -1],
    [["cafétéria", "t"], 4], // "5" is an error in MongoDB docs.
    [["foo.bar.fi", ".", 5], 7],
    [["vanilla", "ll", 0, 2], -1],
    [["vanilla", "ll", -1], Error()], // Error
    [["vanilla", "ll", 12], -1],
    [["vanilla", "ll", 5, 2], -1],
    [["vanilla", "nilla", 3], -1],
    [[null, "foo"], null]
  ],

  $split: [
    [[null, "/"], null],
    [
      ["June-15-2013", "-"],
      ["June", "15", "2013"]
    ],
    [
      ["banana split", "a"],
      ["b", "n", "n", " split"]
    ],
    [
      ["Hello World", " "],
      ["Hello", "World"]
    ],
    [
      ["astronomical", "astro"],
      ["", "nomical"]
    ],
    [["pea green boat", "owl"], ["pea green boat"]],
    [["headphone jack", 7], Error()],
    [["headphone jack", /jack/], Error()]
  ],

  $strLenBytes: [
    [100, Error("resolve to string")],
    ["abcde", 5], // Each character is encoded using one byte.
    ["Hello World!", 12], //	Each character is encoded using one byte.
    ["cafeteria", 9], //	Each character is encoded using one byte.
    ["cafétéria", 11], //	é is encoded using two bytes.
    ["", 0], //Empty strings return 0.
    [{ $strLenBytes: { $literal: "$€λG" } }, 7], // € is encoded using three bytes. λ is encoded using two bytes.
    ["寿司", 6] // Each character is encoded using three bytes.
  ],

  $strLenCP: [
    [100, Error("resolve to string")],
    ["abcde", 5],
    ["Hello World!", 12],
    ["cafeteria", 9],
    ["cafétéria", 9],
    ["", 0],
    [{ $strLenCP: { $literal: "$€λG" } }, 4],
    ["寿司", 2]
  ],

  $strcasecmp: [
    [[null, undefined], 0],
    [[12, "23"], Error("array of string")],
    [["13Q1", "13q4"], -1],
    [["13Q4", "13q4"], 0],
    [["14Q2", "13q4"], 1]
  ],

  $substrCP: [
    [[null, 2], Error("expects array(3)")],
    [[null, 0, 1], ""],
    [[100, 0, 1], Error("arg1 <string>")],
    [["100", 2.5, 1], Error("arg2 <index>")],
    [["100", 2, true], Error("arg3 <count>")],
    [["hello", -1, 5], ""],
    [["hello", 1, -2], "ello"],
    [["abcde", 1, 2], "bc"],
    [["Hello World!", 6, 5], "World"],
    [["cafétéria", 0, 5], "cafét"],
    [["cafétéria", 5, 4], "éria"],
    [["cafétéria", 7, 3], "ia"],
    [["cafétéria", 3, 1], "é"]
  ],

  $substrBytes: [
    [[null, 2], Error("expects array(3)")],
    [[100, 0, 1], Error("arg1 <string>")],
    [[null, "invalid", 3], Error("<index>")],
    [["", "invalid", 3], Error("<index>")],
    [["", 0, "invalid"], Error("<count>")],
    [[null, 0, 1], ""],
    [["", 0, 1], ""],
    [["abcde", 1, 2], "bc"],
    [["Hello World!", 6, 5], "World"],
    [["cafétéria", 0, 5], "café"],
    [["cafétéria", 5, 4], "tér"],
    [["cafétéria", 7, 3], Error()],
    [["cafétéria", 3, 1], Error()],
    [["éclair", 0, 3], "éc"],
    [["jalapeño", 0, 3], "jal"],
    [["寿司sushi", 0, 3], "寿"],
    [["桁", 0, 3], "桁"],
    [["😀", 0, 4], "😀"],
    [["A😀B", 6, 0], ""],
    [["A😀B", 5, 2], Error("count extends beyond UTF-8 length")],
    [["A😀B", 1, 10], Error("count extends beyond UTF-8 length")],
    [["A😀B", 7, 1], Error("byte index out of range")],
    [["", 1, 1], Error("byte index out of range")],
    [["😀🌈", 0, 4], "😀"]
  ],

  $toLower: [
    [null, null],
    [["ABC"], "abc"], // accepts array(1) argument
    ["ABC123", "abc123"]
  ],

  $toUpper: [
    [null, null],
    [["abc"], "ABC"], // accepts array(1) argument
    ["abc123", "ABC123"]
  ],

  $trim: [
    [{ $trim: { input: "  \n good  bye \t  " } }, "good  bye"],
    [{ $trim: { input: " ggggoodbyeeeee", chars: "ge" } }, " ggggoodby"],
    [{ $trim: { input: "    ggggoodbyeeeee", chars: " ge" } }, "oodby"],
    [{ $trim: { input: null } }, null]
  ],

  $ltrim: [
    [{ $ltrim: { input: "  \n good  bye \t  " } }, "good  bye \t  "],
    [{ $ltrim: { input: " ggggoodbyeeeee", chars: "ge" } }, " ggggoodbyeeeee"],
    [{ $ltrim: { input: "    ggggoodbyeeeee ", chars: " gd" } }, "oodbyeeeee "],
    [{ $ltrim: { input: null } }, null]
  ],

  $rtrim: [
    [{ $rtrim: { input: "  \n good  bye \t  " } }, "  \n good  bye"],
    [{ $rtrim: { input: " ggggoodbyeeeee", chars: "ge" } }, " ggggoodby"],
    [{ $rtrim: { input: " ggggoodbyeeeee    ", chars: "e " } }, " ggggoodby"],
    [{ $rtrim: { input: null } }, null]
  ],

  $toString: [
    [null, null],
    [10, "10"],
    [["not allowed"], Error("cannot convert from object")]
  ],

  $replaceOne: [
    [{ input: 0, find: "abc", replacement: "ABC" }, Error("'input'.+string")],
    [{ input: "abc", find: 0, replacement: "ABC" }, Error("'find'.+string")],
    [
      { input: "abc", find: "abc", replacement: 0 },
      Error("'replacement'.+string")
    ],
    [{ input: null, find: "abc", replacement: "ABC" }, null],
    [{ input: "abc", find: null, replacement: "ABC" }, null],
    [{ input: "abc", find: "abc", replacement: null }, null]
  ],

  $replaceAll: [
    [{ input: 0, find: "abc", replacement: "ABC" }, Error("'input'.+string")],
    [{ input: "abc", find: 0, replacement: "ABC" }, Error("'find'.+string")],
    [
      { input: "abc", find: "abc", replacement: 0 },
      Error("'replacement'.+string")
    ],
    [{ input: null, find: "abc", replacement: "ABC" }, null],
    [{ input: "abc", find: null, replacement: "ABC" }, null],
    [{ input: "abc", find: "abc", replacement: null }, null]
  ]
});

const data = [
  { _id: 1, fname: "Carol", lname: "Smith", phone: "718-555-0113" },
  { _id: 2, fname: "Daryl", lname: "Doe", phone: "212-555-8832" },
  { _id: 3, fname: "Polly", lname: "Andrews", phone: "208-555-1932" },
  { _id: 4, fname: "Colleen", lname: "Duncan", phone: "775-555-0187" },
  { _id: 5, fname: "Luna", lname: "Clarke", phone: "917-555-4414" }
];

const productsData = [
  { _id: 1, description: "Single LINE description." },
  { _id: 2, description: "First lines\nsecond line" },
  { _id: 3, description: "Many spaces before     line" },
  { _id: 4, description: "Multiple\nline descriptions" },
  { _id: 5, description: "anchors, links and hyperlinks" },
  { _id: 6, description: "métier work vocation" }
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
              options: "si"
            }
          }
        }
      }
    ],
    expected: [
      { _id: 1, description: "Single LINE description.", returns: false },
      { _id: 2, description: "First lines\nsecond line", returns: false },
      { _id: 3, description: "Many spaces before     line", returns: true },
      { _id: 4, description: "Multiple\nline descriptions", returns: true },
      { _id: 5, description: "anchors, links and hyperlinks", returns: false },
      { _id: 6, description: "métier work vocation", returns: false }
    ]
  }
]);

support.runTestPipeline("$regexFind operators", [
  {
    message: "can apply $regexFind",
    input: [
      { _id: 1, category: "café" },
      { _id: 2, category: "cafe" },
      { _id: 3, category: "cafE" }
    ],
    pipeline: [
      {
        $addFields: {
          resultObject: { $regexFind: { input: "$category", regex: /cafe/ } }
        }
      }
    ],
    expected: [
      { _id: 1, category: "café", resultObject: null },
      {
        _id: 2,
        category: "cafe",
        resultObject: { match: "cafe", idx: 0, captures: [] }
      },
      { _id: 3, category: "cafE", resultObject: null }
    ]
  },

  {
    message: "$regexFind with 'captures': 1",
    input: data,
    pipeline: [
      {
        $project: {
          returnObject: {
            $regexFind: { input: "$fname", regex: /(C(ar)*)ol/ }
          }
        }
      }
    ],
    expected: [
      {
        _id: 1,
        returnObject: { match: "Carol", idx: 0, captures: ["Car", "ar"] }
      },
      { _id: 2, returnObject: null },
      { _id: 3, returnObject: null },
      { _id: 4, returnObject: { match: "Col", idx: 0, captures: ["C", null] } },
      { _id: 5, returnObject: null }
    ]
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
              regex: /^(718).*|^(212).*|^(917).*/
            }
          }
        }
      }
    ],
    expected: [
      {
        _id: 1,
        nycContacts: {
          match: "718-555-0113",
          idx: 0,
          captures: ["718", null, null]
        }
      },
      {
        _id: 2,
        nycContacts: {
          match: "212-555-8832",
          idx: 0,
          captures: [null, "212", null]
        }
      },
      { _id: 3, nycContacts: null },
      { _id: 4, nycContacts: null },
      {
        _id: 5,
        nycContacts: {
          match: "917-555-4414",
          idx: 0,
          captures: [null, null, "917"]
        }
      }
    ]
  },

  {
    message: "$regexFind without grouping",
    input: productsData,
    pipeline: [
      {
        $addFields: {
          returnObject: {
            $regexFind: { input: "$description", regex: /line/ }
          }
        }
      }
    ],
    expected: [
      { _id: 1, description: "Single LINE description.", returnObject: null },
      {
        _id: 2,
        description: "First lines\nsecond line",
        returnObject: { match: "line", idx: 6, captures: [] }
      },
      {
        _id: 3,
        description: "Many spaces before     line",
        returnObject: { match: "line", idx: 23, captures: [] }
      },
      {
        _id: 4,
        description: "Multiple\nline descriptions",
        returnObject: { match: "line", idx: 9, captures: [] }
      },
      {
        _id: 5,
        description: "anchors, links and hyperlinks",
        returnObject: null
      },
      { _id: 6, description: "métier work vocation", returnObject: null }
    ]
  },

  {
    message: "$regexFind with grouping",
    input: productsData,
    pipeline: [
      {
        $addFields: {
          returnObject: {
            $regexFind: { input: "$description", regex: /lin(e|k)/ }
          }
        }
      }
    ],
    expected: [
      { _id: 1, description: "Single LINE description.", returnObject: null },
      {
        _id: 2,
        description: "First lines\nsecond line",
        returnObject: { match: "line", idx: 6, captures: ["e"] }
      },
      {
        _id: 3,
        description: "Many spaces before     line",
        returnObject: { match: "line", idx: 23, captures: ["e"] }
      },
      {
        _id: 4,
        description: "Multiple\nline descriptions",
        returnObject: { match: "line", idx: 9, captures: ["e"] }
      },
      {
        _id: 5,
        description: "anchors, links and hyperlinks",
        returnObject: { match: "link", idx: 9, captures: ["k"] }
      },
      { _id: 6, description: "métier work vocation", returnObject: null }
    ]
  },

  {
    message: "$regexFind 'idx' is codepoint",
    input: productsData,
    pipeline: [
      {
        $addFields: {
          returnObject: {
            $regexFind: { input: "$description", regex: /tier/ }
          }
        }
      }
    ],
    expected: [
      { _id: 1, description: "Single LINE description.", returnObject: null },
      { _id: 2, description: "First lines\nsecond line", returnObject: null },
      {
        _id: 3,
        description: "Many spaces before     line",
        returnObject: null
      },
      {
        _id: 4,
        description: "Multiple\nline descriptions",
        returnObject: null
      },
      {
        _id: 5,
        description: "anchors, links and hyperlinks",
        returnObject: null
      },
      {
        _id: 6,
        description: "métier work vocation",
        returnObject: { match: "tier", idx: 2, captures: [] }
      }
    ]
  },

  {
    message: "$regexFind with option 'i'",
    input: productsData,
    pipeline: [
      {
        $addFields: {
          returnObject: {
            $regexFind: { input: "$description", regex: "line", options: "i" }
          }
        }
      }
    ],
    expected: [
      {
        _id: 1,
        description: "Single LINE description.",
        returnObject: { match: "LINE", idx: 7, captures: [] }
      },
      {
        _id: 2,
        description: "First lines\nsecond line",
        returnObject: { match: "line", idx: 6, captures: [] }
      },
      {
        _id: 3,
        description: "Many spaces before     line",
        returnObject: { match: "line", idx: 23, captures: [] }
      },
      {
        _id: 4,
        description: "Multiple\nline descriptions",
        returnObject: { match: "line", idx: 9, captures: [] }
      },
      {
        _id: 5,
        description: "anchors, links and hyperlinks",
        returnObject: null
      },
      { _id: 6, description: "métier work vocation", returnObject: null }
    ]
  },

  {
    message: "$regexFind with option 'm'",
    input: productsData,
    pipeline: [
      {
        $addFields: {
          returnObject: {
            $regexFind: { input: "$description", regex: /^s/im }
          }
        }
      }
    ],
    expected: [
      {
        _id: 1,
        description: "Single LINE description.",
        returnObject: { match: "S", idx: 0, captures: [] }
      },
      {
        _id: 2,
        description: "First lines\nsecond line",
        returnObject: { match: "s", idx: 12, captures: [] }
      },
      {
        _id: 3,
        description: "Many spaces before     line",
        returnObject: null
      },
      {
        _id: 4,
        description: "Multiple\nline descriptions",
        returnObject: null
      },
      {
        _id: 5,
        description: "anchors, links and hyperlinks",
        returnObject: null
      },
      { _id: 6, description: "métier work vocation", returnObject: null }
    ]
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
              options: "si"
            }
          }
        }
      }
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
          captures: []
        }
      },
      {
        _id: 4,
        description: "Multiple\nline descriptions",
        returnObject: { match: "Multiple\nline", idx: 0, captures: [] }
      },
      {
        _id: 5,
        description: "anchors, links and hyperlinks",
        returnObject: null
      },
      { _id: 6, description: "métier work vocation", returnObject: null }
    ]
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
          "Hi, I'm just reading about MongoDB -- aunt.arc.tica@example.com"
      },
      { _id: 2, comment: "I wanted to concatenate a string" },
      {
        _id: 3,
        comment: "I can't find how to convert a date to string. cam@mongodb.com"
      },
      { _id: 4, comment: "It's just me. I'm testing.  fred@MongoDB.com" }
    ],
    pipeline: [
      {
        $addFields: {
          email: {
            $regexFind: {
              input: "$comment",
              regex: /[a-z0-9_.+-]+@[a-z0-9_.+-]+\.[a-z0-9_.+-]+/i
            }
          }
        }
      },
      { $set: { email: "$email.match" } }
    ],
    expected: [
      {
        _id: 1,
        comment:
          "Hi, I'm just reading about MongoDB -- aunt.arc.tica@example.com",
        email: "aunt.arc.tica@example.com"
      },
      { _id: 2, comment: "I wanted to concatenate a string" },
      {
        _id: 3,
        comment:
          "I can't find how to convert a date to string. cam@mongodb.com",
        email: "cam@mongodb.com"
      },
      {
        _id: 4,
        comment: "It's just me. I'm testing.  fred@MongoDB.com",
        email: "fred@MongoDB.com"
      }
    ]
  },

  {
    message: "$regexFind to String Elements of an Array",
    input: [
      {
        _id: 1,
        name: "Aunt Arc Tikka",
        details: ["+672-19-9999", "aunt.arc.tica@example.com"]
      },
      {
        _id: 2,
        name: "Belle Gium",
        details: ["+32-2-111-11-11", "belle.gium@example.com"]
      },
      {
        _id: 3,
        name: "Cam Bo Dia",
        details: ["+855-012-000-0000", "cam.bo.dia@example.com"]
      },
      { _id: 4, name: "Fred", details: ["+1-111-222-3333"] }
    ],
    pipeline: [
      { $unwind: "$details" },
      {
        $addFields: {
          regexemail: {
            $regexFind: {
              input: "$details",
              regex: /^[a-z0-9_.+-]+@[a-z0-9_.+-]+\.[a-z0-9_.+-]+$/,
              options: "i"
            }
          },
          regexphone: {
            $regexFind: {
              input: "$details",
              regex: /^[+]{0,1}[0-9]*-?[0-9_-]+$/
            }
          }
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          details: { email: "$regexemail.match", phone: "$regexphone.match" }
        }
      },
      {
        $group: {
          _id: "$_id",
          name: { $first: "$name" },
          details: { $mergeObjects: "$details" }
        }
      },
      { $sort: { _id: 1 } }
    ],
    expected: [
      {
        _id: 1,
        name: "Aunt Arc Tikka",
        details: { phone: "+672-19-9999", email: "aunt.arc.tica@example.com" }
      },
      {
        _id: 2,
        name: "Belle Gium",
        details: { phone: "+32-2-111-11-11", email: "belle.gium@example.com" }
      },
      {
        _id: 3,
        name: "Cam Bo Dia",
        details: {
          phone: "+855-012-000-0000",
          email: "cam.bo.dia@example.com"
        }
      },
      { _id: 4, name: "Fred", details: { phone: "+1-111-222-3333" } }
    ]
  },

  {
    message: "$regexFind: Use Captured Groupings to Parse User Name",
    input: [
      { _id: 1, name: "Aunt Arc Tikka", email: "aunt.tica@example.com" },
      { _id: 2, name: "Belle Gium", email: "belle.gium@example.com" },
      { _id: 3, name: "Cam Bo Dia", email: "cam.dia@example.com" },
      { _id: 4, name: "Fred" }
    ],
    pipeline: [
      {
        $addFields: {
          username: {
            $regexFind: {
              input: "$email",
              regex: /^([a-z0-9_.+-]+)@[a-z0-9_.+-]+\.[a-z0-9_.+-]+$/,
              options: "i"
            }
          }
        }
      },
      { $set: { username: { $arrayElemAt: ["$username.captures", 0] } } }
    ],
    expected: [
      {
        _id: 1,
        name: "Aunt Arc Tikka",
        email: "aunt.tica@example.com",
        username: "aunt.tica"
      },
      {
        _id: 2,
        name: "Belle Gium",
        email: "belle.gium@example.com",
        username: "belle.gium"
      },
      {
        _id: 3,
        name: "Cam Bo Dia",
        email: "cam.dia@example.com",
        username: "cam.dia"
      },
      { _id: 4, name: "Fred", username: null }
    ]
  }
]);

support.runTestPipeline("$regexFindAll operator", [
  {
    message: "can apply $regexFindAll",
    input: [
      { _id: 1, category: "café" },
      { _id: 2, category: "cafe" },
      { _id: 3, category: "cafE" }
    ],
    pipeline: [
      {
        $addFields: {
          resultObject: {
            $regexFindAll: { input: "$category", regex: /cafe/ }
          }
        }
      }
    ],
    expected: [
      { _id: 1, category: "café", resultObject: [] },
      {
        _id: 2,
        category: "cafe",
        resultObject: [{ match: "cafe", idx: 0, captures: [] }]
      },
      { _id: 3, category: "cafE", resultObject: [] }
    ]
  },

  {
    message: "$regexFindAll with 'captures': 1",
    input: data,
    pipeline: [
      {
        $project: {
          returnObject: {
            $regexFindAll: { input: "$fname", regex: /(C(ar)*)ol/ }
          }
        }
      }
    ],
    expected: [
      {
        _id: 1,
        returnObject: [{ match: "Carol", idx: 0, captures: ["Car", "ar"] }]
      },
      { _id: 2, returnObject: [] },
      { _id: 3, returnObject: [] },
      {
        _id: 4,
        returnObject: [{ match: "Col", idx: 0, captures: ["C", null] }]
      },
      { _id: 5, returnObject: [] }
    ]
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
              regex: /^(718).*|^(212).*|^(917).*/
            }
          }
        }
      }
    ],
    expected: [
      {
        _id: 1,
        nycContacts: [
          { match: "718-555-0113", idx: 0, captures: ["718", null, null] }
        ]
      },
      {
        _id: 2,
        nycContacts: [
          { match: "212-555-8832", idx: 0, captures: [null, "212", null] }
        ]
      },
      { _id: 3, nycContacts: [] },
      { _id: 4, nycContacts: [] },
      {
        _id: 5,
        nycContacts: [
          { match: "917-555-4414", idx: 0, captures: [null, null, "917"] }
        ]
      }
    ]
  },

  {
    message: "$regexFindAll without grouping",
    input: productsData,
    pipeline: [
      {
        $addFields: {
          returnObject: {
            $regexFindAll: { input: "$description", regex: /line/ }
          }
        }
      }
    ],
    expected: [
      { _id: 1, description: "Single LINE description.", returnObject: [] },
      {
        _id: 2,
        description: "First lines\nsecond line",
        returnObject: [
          { match: "line", idx: 6, captures: [] },
          { match: "line", idx: 19, captures: [] }
        ]
      },
      {
        _id: 3,
        description: "Many spaces before     line",
        returnObject: [{ match: "line", idx: 23, captures: [] }]
      },
      {
        _id: 4,
        description: "Multiple\nline descriptions",
        returnObject: [{ match: "line", idx: 9, captures: [] }]
      },
      {
        _id: 5,
        description: "anchors, links and hyperlinks",
        returnObject: []
      },
      { _id: 6, description: "métier work vocation", returnObject: [] }
    ]
  },

  {
    message: "$regexFindAll with grouping",
    input: productsData,
    pipeline: [
      {
        $addFields: {
          returnObject: {
            $regexFindAll: { input: "$description", regex: /lin(e|k)/ }
          }
        }
      }
    ],
    expected: [
      { _id: 1, description: "Single LINE description.", returnObject: [] },
      {
        _id: 2,
        description: "First lines\nsecond line",
        returnObject: [
          { match: "line", idx: 6, captures: ["e"] },
          { match: "line", idx: 19, captures: ["e"] }
        ]
      },
      {
        _id: 3,
        description: "Many spaces before     line",
        returnObject: [{ match: "line", idx: 23, captures: ["e"] }]
      },
      {
        _id: 4,
        description: "Multiple\nline descriptions",
        returnObject: [{ match: "line", idx: 9, captures: ["e"] }]
      },
      {
        _id: 5,
        description: "anchors, links and hyperlinks",
        returnObject: [
          { match: "link", idx: 9, captures: ["k"] },
          { match: "link", idx: 24, captures: ["k"] }
        ]
      },
      { _id: 6, description: "métier work vocation", returnObject: [] }
    ]
  },

  {
    message: "$regexFindAll 'idx' is codepoint",
    input: productsData,
    pipeline: [
      {
        $addFields: {
          returnObject: {
            $regexFindAll: { input: "$description", regex: /tier/ }
          }
        }
      }
    ],
    expected: [
      { _id: 1, description: "Single LINE description.", returnObject: [] },
      { _id: 2, description: "First lines\nsecond line", returnObject: [] },
      { _id: 3, description: "Many spaces before     line", returnObject: [] },
      { _id: 4, description: "Multiple\nline descriptions", returnObject: [] },
      {
        _id: 5,
        description: "anchors, links and hyperlinks",
        returnObject: []
      },
      {
        _id: 6,
        description: "métier work vocation",
        returnObject: [{ match: "tier", idx: 2, captures: [] }]
      }
    ]
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
              options: "i"
            }
          }
        }
      }
    ],
    expected: [
      {
        _id: 1,
        description: "Single LINE description.",
        returnObject: [{ match: "LINE", idx: 7, captures: [] }]
      },
      {
        _id: 2,
        description: "First lines\nsecond line",
        returnObject: [
          { match: "line", idx: 6, captures: [] },
          { match: "line", idx: 19, captures: [] }
        ]
      },
      {
        _id: 3,
        description: "Many spaces before     line",
        returnObject: [{ match: "line", idx: 23, captures: [] }]
      },
      {
        _id: 4,
        description: "Multiple\nline descriptions",
        returnObject: [{ match: "line", idx: 9, captures: [] }]
      },
      {
        _id: 5,
        description: "anchors, links and hyperlinks",
        returnObject: []
      },
      { _id: 6, description: "métier work vocation", returnObject: [] }
    ]
  },

  {
    message: "$regexFindAll with option 'm'",
    input: productsData,
    pipeline: [
      {
        $addFields: {
          returnObject: {
            $regexFindAll: { input: "$description", regex: /^s/im }
          }
        }
      }
    ],
    expected: [
      {
        _id: 1,
        description: "Single LINE description.",
        returnObject: [{ match: "S", idx: 0, captures: [] }]
      },
      {
        _id: 2,
        description: "First lines\nsecond line",
        returnObject: [{ match: "s", idx: 12, captures: [] }]
      },
      { _id: 3, description: "Many spaces before     line", returnObject: [] },
      { _id: 4, description: "Multiple\nline descriptions", returnObject: [] },
      {
        _id: 5,
        description: "anchors, links and hyperlinks",
        returnObject: []
      },
      { _id: 6, description: "métier work vocation", returnObject: [] }
    ]
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
              options: "si"
            }
          }
        }
      }
    ],
    expected: [
      { _id: 1, description: "Single LINE description.", returnObject: [] },
      { _id: 2, description: "First lines\nsecond line", returnObject: [] },
      {
        _id: 3,
        description: "Many spaces before     line",
        returnObject: [
          { match: "Many spaces before     line", idx: 0, captures: [] }
        ]
      },
      {
        _id: 4,
        description: "Multiple\nline descriptions",
        returnObject: [{ match: "Multiple\nline", idx: 0, captures: [] }]
      },
      {
        _id: 5,
        description: "anchors, links and hyperlinks",
        returnObject: []
      },
      { _id: 6, description: "métier work vocation", returnObject: [] }
    ]
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
          "Hi, I'm just reading about MongoDB -- aunt.arc.tica@example.com"
      },
      { _id: 2, comment: "I wanted to concatenate a string" },
      {
        _id: 3,
        comment:
          "How do I convert a date to string? Contact me at either cam@mongodb.com or c.dia@mongodb.com"
      },
      { _id: 4, comment: "It's just me. I'm testing.  fred@MongoDB.com" }
    ],
    pipeline: [
      {
        $addFields: {
          email: {
            $regexFindAll: {
              input: "$comment",
              regex: /[a-z0-9_.+-]+@[a-z0-9_.+-]+\.[a-z0-9_.+-]+/i
            }
          }
        }
      },
      { $set: { email: "$email.match" } }
    ],
    expected: [
      {
        _id: 1,
        comment:
          "Hi, I'm just reading about MongoDB -- aunt.arc.tica@example.com",
        email: ["aunt.arc.tica@example.com"]
      },
      { _id: 2, comment: "I wanted to concatenate a string", email: [] },
      {
        _id: 3,
        comment:
          "How do I convert a date to string? Contact me at either cam@mongodb.com or c.dia@mongodb.com",
        email: ["cam@mongodb.com", "c.dia@mongodb.com"]
      },
      {
        _id: 4,
        comment: "It's just me. I'm testing.  fred@MongoDB.com",
        email: ["fred@MongoDB.com"]
      }
    ]
  },

  {
    message: "$regexFindAll: Use Captured Groupings to Parse User Name",
    input: [
      {
        _id: 1,
        comment:
          "Hi, I'm just reading about MongoDB -- aunt.arc.tica@example.com"
      },
      { _id: 2, comment: "I wanted to concatenate a string" },
      {
        _id: 3,
        comment:
          "How do I convert a date to string? Contact me at either cam@mongodb.com or c.dia@mongodb.com"
      },
      { _id: 4, comment: "It's just me. I'm testing.  fred@MongoDB.com" }
    ],
    pipeline: [
      {
        $addFields: {
          names: {
            $regexFindAll: {
              input: "$comment",
              regex: /([a-z0-9_.+-]+)@[a-z0-9_.+-]+\.[a-z0-9_.+-]+/i
            }
          }
        }
      },
      {
        $set: {
          names: {
            $reduce: {
              input: "$names.captures",
              initialValue: [],
              in: { $concatArrays: ["$$value", "$$this"] }
            }
          }
        }
      }
    ],
    expected: [
      {
        _id: 1,
        comment:
          "Hi, I'm just reading about MongoDB -- aunt.arc.tica@example.com",
        names: ["aunt.arc.tica"]
      },
      { _id: 2, comment: "I wanted to concatenate a string", names: [] },
      {
        _id: 3,
        comment:
          "How do I convert a date to string? Contact me at either cam@mongodb.com or c.dia@mongodb.com",
        names: ["cam", "c.dia"]
      },
      {
        _id: 4,
        comment: "It's just me. I'm testing.  fred@MongoDB.com",
        names: ["fred"]
      }
    ]
  }
]);

support.runTestPipeline("$replaceOne: More examples", [
  {
    message: "$replaceOne",
    input: [
      { _id: 1, item: "blue paint" },
      { _id: 2, item: "blue and green paint" },
      { _id: 3, item: "blue paint with blue paintbrush" },
      { _id: 4, item: "blue paint with green paintbrush" }
    ],
    pipeline: [
      {
        $project: {
          item: {
            $replaceOne: {
              input: "$item",
              find: "blue paint",
              replacement: "red paint"
            }
          }
        }
      }
    ],
    expected: [
      { _id: 1, item: "red paint" },
      { _id: 2, item: "blue and green paint" },
      { _id: 3, item: "red paint with blue paintbrush" },
      { _id: 4, item: "red paint with green paintbrush" }
    ]
  }
]);

support.runTestPipeline("$replaceAll: More examples", [
  {
    message: "$replaceAll",
    input: [
      { _id: 1, item: "blue paint" },
      { _id: 2, item: "blue and green paint" },
      { _id: 3, item: "blue paint with blue paintbrush" },
      { _id: 4, item: "blue paint with green paintbrush" }
    ],
    pipeline: [
      {
        $project: {
          item: {
            $replaceAll: {
              input: "$item",
              find: "blue paint",
              replacement: "red paint"
            }
          }
        }
      }
    ],
    expected: [
      { _id: 1, item: "red paint" },
      { _id: 2, item: "blue and green paint" },
      { _id: 3, item: "red paint with red paintbrush" },
      { _id: 4, item: "red paint with green paintbrush" }
    ]
  }
]);

// Regression: MongoDB treats $replaceAll/$replaceOne `find` as a LITERAL string,
// not a regular expression. Previously `find` was compiled with
// `new RegExp(find, "g")`, so regex metacharacters in `find` matched the wrong
// text (silent wrong output) and a crafted `find` could trigger catastrophic
// backtracking (ReDoS) when the query came from untrusted input.
support.runTestPipeline("$replaceAll: find is literal, not a regex", [
  {
    message: "regex metacharacters in find match literally",
    input: [
      { _id: 1, v: "a.b.c" },
      { _id: 2, v: "axbxc" },
      { _id: 3, v: "(a)+[b]" }
    ],
    pipeline: [
      {
        $project: {
          v: { $replaceAll: { input: "$v", find: ".", replacement: "X" } }
        }
      }
    ],
    // literal '.' replaces only the real dots in #1; #2 and #3 have none
    expected: [
      { _id: 1, v: "aXbXc" },
      { _id: 2, v: "axbxc" },
      { _id: 3, v: "(a)+[b]" }
    ]
  },
  {
    message: "literal grouping/quantifier metacharacters in find",
    input: [{ _id: 1, v: "x(a)+[b]y" }],
    pipeline: [
      {
        $project: {
          v: { $replaceAll: { input: "$v", find: "(a)+[b]", replacement: "Z" } }
        }
      }
    ],
    expected: [{ _id: 1, v: "xZy" }]
  }
]);

support.runTestPipeline("$replaceOne: find is literal, first match only", [
  {
    message: "regex metacharacter in find matches literally, first occurrence",
    input: [{ _id: 1, v: "a.b.c" }],
    pipeline: [
      {
        $project: {
          v: { $replaceOne: { input: "$v", find: ".", replacement: "X" } }
        }
      }
    ],
    expected: [{ _id: 1, v: "aXb.c" }]
  }
]);
