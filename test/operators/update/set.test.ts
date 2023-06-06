import "../../support";

import { $set } from "../../../src/operators/update";

describe("operators/update/set", () => {
  it("Set Top-Level Fields", () => {
    const state = {
      _id: 100,
      quantity: 250,
      instock: true,
      reorder: false,
      details: { model: "14QQ", make: "Clothes Corp" },
      tags: ["apparel", "clothing"],
      ratings: [{ by: "Customer007", rating: 4 }]
    };
    expect(
      $set(state, {
        quantity: 500,
        details: { model: "2600", make: "Fashionaires" },
        tags: ["coats", "outerwear", "clothing"]
      })
    ).toEqual(["quantity", "details", "tags"]);

    expect(state).toEqual({
      _id: 100,
      quantity: 500,
      instock: true,
      reorder: false,
      details: { model: "2600", make: "Fashionaires" },
      tags: ["coats", "outerwear", "clothing"],
      ratings: [{ by: "Customer007", rating: 4 }]
    });
  });

  it("Set Fields in Embedded Documents", () => {
    const state = {
      _id: 100,
      quantity: 500,
      instock: true,
      reorder: false,
      details: { model: "2600", make: "Fashionaires" },
      tags: ["coats", "outerwear", "clothing"],
      ratings: [{ by: "Customer007", rating: 4 }]
    };
    expect($set(state, { "details.make": "Kustom Kidz" })).toEqual([
      "details.make"
    ]);
    expect(state).toEqual({
      _id: 100,
      quantity: 500,
      instock: true,
      reorder: false,
      details: { model: "2600", make: "Kustom Kidz" },
      tags: ["coats", "outerwear", "clothing"],
      ratings: [{ by: "Customer007", rating: 4 }]
    });
  });

  it("Set Elements in Arrays", () => {
    const state = {
      _id: 100,
      quantity: 500,
      instock: true,
      reorder: false,
      details: { model: "2600", make: "Kustom Kidz" },
      tags: ["coats", "outerwear", "clothing"],
      ratings: [{ by: "Customer007", rating: 4 }]
    };
    expect(
      $set(state, {
        "tags.1": "rain gear",
        "ratings.0.rating": 2
      })
    ).toEqual(["tags.1", "ratings.0.rating"]);
    expect(state).toEqual({
      _id: 100,
      quantity: 500,
      instock: true,
      reorder: false,
      details: { model: "2600", make: "Kustom Kidz" },
      tags: ["coats", "rain gear", "clothing"],
      ratings: [{ by: "Customer007", rating: 2 }]
    });
  });

  it("Update All Array Elements That Match arrayFilters", () => {
    const states = [
      { _id: 1, grades: [95, 92, 90] },
      { _id: 2, grades: [98, 100, 102] },
      { _id: 3, grades: [95, 110, 100] }
    ];
    const results = [
      { _id: 1, grades: [95, 92, 90] },
      { _id: 2, grades: [98, 100, 100] },
      { _id: 3, grades: [95, 100, 100] }
    ];

    const paths = [[], ["grades"], ["grades"]];

    states.forEach((s, i) => {
      expect(
        $set(s, { "grades.$[element]": 100 }, [{ element: { $gte: 100 } }])
      ).toEqual(paths[i]);
      expect(s).toEqual(results[i]);
    });
  });

  it("Update All Documents That Match arrayFilters in an Array", () => {
    const states = [
      {
        _id: 1,
        grades: [
          { grade: 80, mean: 75, std: 6 },
          { grade: 85, mean: 90, std: 4 },
          { grade: 85, mean: 85, std: 6 }
        ]
      },
      {
        _id: 2,
        grades: [
          { grade: 90, mean: 75, std: 6 },
          { grade: 87, mean: 90, std: 3 },
          { grade: 85, mean: 85, std: 4 }
        ]
      }
    ];
    const results = [
      {
        _id: 1,
        grades: [
          { grade: 80, mean: 75, std: 6 },
          { grade: 85, mean: 100, std: 4 },
          { grade: 85, mean: 100, std: 6 }
        ]
      },
      {
        _id: 2,
        grades: [
          { grade: 90, mean: 100, std: 6 },
          { grade: 87, mean: 100, std: 3 },
          { grade: 85, mean: 100, std: 4 }
        ]
      }
    ];

    states.forEach((s, i) => {
      $set(s, { "grades.$[elem].mean": 100 }, [{ "elem.grade": { $gte: 85 } }]);
      expect(s).toEqual(results[i]);
    });
  });

  it("Update Array Elements Using a Negation Operator", () => {
    const states = [
      {
        _id: 1,
        name: "Christine Franklin",
        degrees: [{ level: "Master" }, { level: "Bachelor" }]
      },
      {
        _id: 2,
        name: "Reyansh Sengupta",
        degrees: [{ level: "Bachelor" }]
      }
    ];
    const results = [
      {
        _id: 1,
        name: "Christine Franklin",
        degrees: [{ level: "Master", gradcampaign: 1 }, { level: "Bachelor" }]
      },
      {
        _id: 2,
        name: "Reyansh Sengupta",
        degrees: [{ level: "Bachelor" }]
      }
    ];
    states.forEach((s, i) => {
      $set(s, { "degrees.$[degree].gradcampaign": 1 }, [
        { "degree.level": { $ne: "Bachelor" } }
      ]);
      expect(s).toEqual(results[i]);
    });
  });
});
