import { describe, expect, it } from "vitest";

import { aggregate } from "../../../src";
import { DEFAULT_OPTS, testPath } from "../../support";

describe(testPath(import.meta.url), () => {
  const employees = [
    { _id: 1, name: "Dev" },
    { _id: 2, name: "Eliot", reportsTo: "Dev" },
    { _id: 3, name: "Ron", reportsTo: "Eliot" },
    { _id: 4, name: "Andrew", reportsTo: "Eliot" },
    { _id: 5, name: "Asya", reportsTo: "Ron" },
    { _id: 6, name: "Dan", reportsTo: "Andrew" }
  ];

  it("Within a Single Collection", () => {
    const result = aggregate(employees, [
      {
        $graphLookup: {
          from: employees,
          startWith: "$reportsTo",
          connectFromField: "reportsTo",
          connectToField: "name",
          as: "reportingHierarchy"
        }
      },
      {
        $addFields: {
          reportingHierarchy: {
            $sortArray: { input: "$reportingHierarchy", sortBy: { _id: -1 } }
          }
        }
      }
    ]);

    expect(result).toEqual([
      {
        _id: 1,
        name: "Dev",
        reportingHierarchy: []
      },
      {
        _id: 2,
        name: "Eliot",
        reportsTo: "Dev",
        reportingHierarchy: [{ _id: 1, name: "Dev" }]
      },
      {
        _id: 3,
        name: "Ron",
        reportsTo: "Eliot",
        reportingHierarchy: [
          { _id: 2, name: "Eliot", reportsTo: "Dev" },
          { _id: 1, name: "Dev" }
        ]
      },
      {
        _id: 4,
        name: "Andrew",
        reportsTo: "Eliot",
        reportingHierarchy: [
          { _id: 2, name: "Eliot", reportsTo: "Dev" },
          { _id: 1, name: "Dev" }
        ]
      },
      {
        _id: 5,
        name: "Asya",
        reportsTo: "Ron",
        reportingHierarchy: [
          { _id: 3, name: "Ron", reportsTo: "Eliot" },
          { _id: 2, name: "Eliot", reportsTo: "Dev" },
          { _id: 1, name: "Dev" }
        ]
      },
      {
        _id: 6,
        name: "Dan",
        reportsTo: "Andrew",
        reportingHierarchy: [
          { _id: 4, name: "Andrew", reportsTo: "Eliot" },
          { _id: 2, name: "Eliot", reportsTo: "Dev" },
          { _id: 1, name: "Dev" }
        ]
      }
    ]);
  });

  it("Across Multiple Collections", () => {
    const airports = [
      { _id: 0, airport: "JFK", connects: ["BOS", "ORD"] },
      { _id: 1, airport: "BOS", connects: ["JFK", "PWM"] },
      { _id: 2, airport: "ORD", connects: ["JFK"] },
      { _id: 3, airport: "PWM", connects: ["BOS", "LHR"] },
      { _id: 4, airport: "LHR", connects: ["PWM"] }
    ];

    const travelers = [
      { _id: 1, name: "Dev", nearestAirport: "JFK" },
      { _id: 2, name: "Eliot", nearestAirport: "JFK" },
      { _id: 3, name: "Jeff", nearestAirport: "BOS" }
    ];

    const result = aggregate(travelers, [
      {
        $graphLookup: {
          from: airports,
          startWith: "$nearestAirport",
          connectFromField: "connects",
          connectToField: "airport",
          maxDepth: 2,
          depthField: "numConnections",
          as: "destinations"
        }
      },
      {
        $addFields: {
          destinations: {
            $sortArray: { input: "$destinations", sortBy: { _id: -1 } }
          }
        }
      }
    ]);

    expect(result).toEqual([
      {
        _id: 1,
        name: "Dev",
        nearestAirport: "JFK",
        destinations: [
          {
            _id: 3,
            airport: "PWM",
            connects: ["BOS", "LHR"],
            numConnections: 2
          },
          { _id: 2, airport: "ORD", connects: ["JFK"], numConnections: 1 },
          {
            _id: 1,
            airport: "BOS",
            connects: ["JFK", "PWM"],
            numConnections: 1
          },
          {
            _id: 0,
            airport: "JFK",
            connects: ["BOS", "ORD"],
            numConnections: 0
          }
        ]
      },
      {
        _id: 2,
        name: "Eliot",
        nearestAirport: "JFK",
        destinations: [
          {
            _id: 3,
            airport: "PWM",
            connects: ["BOS", "LHR"],
            numConnections: 2
          },
          { _id: 2, airport: "ORD", connects: ["JFK"], numConnections: 1 },
          {
            _id: 1,
            airport: "BOS",
            connects: ["JFK", "PWM"],
            numConnections: 1
          },
          {
            _id: 0,
            airport: "JFK",
            connects: ["BOS", "ORD"],
            numConnections: 0
          }
        ]
      },
      {
        _id: 3,
        name: "Jeff",
        nearestAirport: "BOS",
        destinations: [
          { _id: 4, airport: "LHR", connects: ["PWM"], numConnections: 2 },
          {
            _id: 3,
            airport: "PWM",
            connects: ["BOS", "LHR"],
            numConnections: 1
          },
          { _id: 2, airport: "ORD", connects: ["JFK"], numConnections: 2 },
          {
            _id: 1,
            airport: "BOS",
            connects: ["JFK", "PWM"],
            numConnections: 0
          },
          {
            _id: 0,
            airport: "JFK",
            connects: ["BOS", "ORD"],
            numConnections: 1
          }
        ]
      }
    ]);
  });

  it("With a Query Filter", () => {
    const people = [
      {
        _id: 1,
        name: "Tanya Jordan",
        friends: ["Shirley Soto", "Terry Hawkins", "Carole Hale"],
        hobbies: ["tennis", "unicycling", "golf"]
      },
      {
        _id: 2,
        name: "Carole Hale",
        friends: ["Joseph Dennis", "Tanya Jordan", "Terry Hawkins"],
        hobbies: ["archery", "golf", "woodworking"]
      },
      {
        _id: 3,
        name: "Terry Hawkins",
        friends: ["Tanya Jordan", "Carole Hale", "Angelo Ward"],
        hobbies: ["knitting", "frisbee"]
      },
      {
        _id: 4,
        name: "Joseph Dennis",
        friends: ["Angelo Ward", "Carole Hale"],
        hobbies: ["tennis", "golf", "topiary"]
      },
      {
        _id: 5,
        name: "Angelo Ward",
        friends: ["Terry Hawkins", "Shirley Soto", "Joseph Dennis"],
        hobbies: ["travel", "ceramics", "golf"]
      },
      {
        _id: 6,
        name: "Shirley Soto",
        friends: ["Angelo Ward", "Tanya Jordan", "Carole Hale"],
        hobbies: ["frisbee", "set theory"]
      }
    ];

    const collectionResolver = (_: string) => people;

    const result = aggregate(
      people,
      [
        { $match: { name: "Tanya Jordan" } },
        {
          $graphLookup: {
            from: "people",
            startWith: "$friends",
            connectFromField: "friends",
            connectToField: "name",
            as: "golfers",
            restrictSearchWithMatch: { hobbies: "golf" }
          }
        },
        {
          $project: {
            name: 1,
            friends: 1,
            golfer_connections: "$golfers.name"
          }
        },
        {
          $addFields: {
            golfer_connections: {
              $sortArray: { input: "$golfer_connections", sortBy: 1 }
            }
          }
        }
      ],
      { ...DEFAULT_OPTS, collectionResolver }
    );

    expect(result).toEqual([
      {
        _id: 1,
        name: "Tanya Jordan",
        friends: ["Shirley Soto", "Terry Hawkins", "Carole Hale"],
        golfer_connections: [
          "Angelo Ward",
          "Carole Hale",
          "Joseph Dennis",
          "Tanya Jordan"
        ]
      }
    ]);
  });
});
