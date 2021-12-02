import "../../../src/init/system";

import { aggregate } from "../../../src";
import { RawObject } from "../../../src/types";

describe("operators/pipeline/unionWith", () => {
  describe("$unionWith", () => {
    const collections: Record<string, RawObject[]> = {
      warehouses: [
        { _id: 1, warehouse: "A", region: "West", state: "California" },
        { _id: 2, warehouse: "B", region: "Central", state: "Colorado" },
        { _id: 3, warehouse: "C", region: "East", state: "Florida" },
      ],
      sales2019q1: [
        { store: "A", item: "Chocolates", quantity: 150 },
        { store: "B", item: "Chocolates", quantity: 50 },
        { store: "A", item: "Cookies", quantity: 100 },
        { store: "B", item: "Cookies", quantity: 120 },
        { store: "A", item: "Pie", quantity: 10 },
        { store: "B", item: "Pie", quantity: 5 },
      ],
      sales2019q2: [
        { store: "A", item: "Cheese", quantity: 30 },
        { store: "B", item: "Cheese", quantity: 50 },
        { store: "A", item: "Chocolates", quantity: 125 },
        { store: "B", item: "Chocolates", quantity: 150 },
        { store: "A", item: "Cookies", quantity: 200 },
        { store: "B", item: "Cookies", quantity: 100 },
        { store: "B", item: "Nuts", quantity: 100 },
        { store: "A", item: "Pie", quantity: 30 },
        { store: "B", item: "Pie", quantity: 25 },
      ],
      sales2019q3: [
        { store: "A", item: "Cheese", quantity: 50 },
        { store: "B", item: "Cheese", quantity: 20 },
        { store: "A", item: "Chocolates", quantity: 125 },
        { store: "B", item: "Chocolates", quantity: 150 },
        { store: "A", item: "Cookies", quantity: 200 },
        { store: "B", item: "Cookies", quantity: 100 },
        { store: "A", item: "Nuts", quantity: 80 },
        { store: "B", item: "Nuts", quantity: 30 },
        { store: "A", item: "Pie", quantity: 50 },
        { store: "B", item: "Pie", quantity: 75 },
      ],
      sales2019q4: [
        { store: "A", item: "Cheese", quantity: 100 },
        { store: "B", item: "Cheese", quantity: 100 },
        { store: "A", item: "Chocolates", quantity: 200 },
        { store: "B", item: "Chocolates", quantity: 300 },
        { store: "A", item: "Cookies", quantity: 500 },
        { store: "B", item: "Cookies", quantity: 400 },
        { store: "A", item: "Nuts", quantity: 100 },
        { store: "B", item: "Nuts", quantity: 200 },
        { store: "A", item: "Pie", quantity: 100 },
        { store: "B", item: "Pie", quantity: 100 },
      ],
    };

    const options = {
      collectionResolver: (s: string): RawObject[] => collections[s],
    };

    it("Duplicates Results", () => {
      const suppliers = [
        { _id: 1, supplier: "Aardvark and Sons", state: "Texas" },
        { _id: 2, supplier: "Bears Run Amok.", state: "Colorado" },
        { _id: 3, supplier: "Squid Mark Inc. ", state: "Rhode Island" },
      ];

      const result = aggregate(
        suppliers,
        [
          { $project: { state: 1, _id: 0 } },
          {
            $unionWith: {
              coll: "warehouses",
              pipeline: [{ $project: { state: 1, _id: 0 } }],
            },
          },
        ],
        options
      );

      expect(result).toStrictEqual([
        { state: "Texas" },
        { state: "Colorado" },
        { state: "Rhode Island" },
        { state: "California" },
        { state: "Colorado" },
        { state: "Florida" },
      ]);
    });

    it("Create a Yearly Report from the Union of Quarterly Data Collections", () => {
      const result = aggregate(
        collections.sales2019q1,
        [
          { $set: { _id: "2019Q1" } },
          {
            $unionWith: {
              coll: "sales2019q2",
              pipeline: [{ $set: { _id: "2019Q2" } }],
            },
          },
          {
            $unionWith: {
              coll: "sales2019q3",
              pipeline: [{ $set: { _id: "2019Q3" } }],
            },
          },
          {
            $unionWith: {
              coll: collections.sales2019q4,
              pipeline: [{ $set: { _id: "2019Q4" } }],
            },
          },
          { $sort: { _id: 1, store: 1, item: 1 } },
        ],
        options
      );

      expect(result).toStrictEqual([
        { _id: "2019Q1", store: "A", item: "Chocolates", quantity: 150 },
        { _id: "2019Q1", store: "A", item: "Cookies", quantity: 100 },
        { _id: "2019Q1", store: "A", item: "Pie", quantity: 10 },
        { _id: "2019Q1", store: "B", item: "Chocolates", quantity: 50 },
        { _id: "2019Q1", store: "B", item: "Cookies", quantity: 120 },
        { _id: "2019Q1", store: "B", item: "Pie", quantity: 5 },
        { _id: "2019Q2", store: "A", item: "Cheese", quantity: 30 },
        { _id: "2019Q2", store: "A", item: "Chocolates", quantity: 125 },
        { _id: "2019Q2", store: "A", item: "Cookies", quantity: 200 },
        { _id: "2019Q2", store: "A", item: "Pie", quantity: 30 },
        { _id: "2019Q2", store: "B", item: "Cheese", quantity: 50 },
        { _id: "2019Q2", store: "B", item: "Chocolates", quantity: 150 },
        { _id: "2019Q2", store: "B", item: "Cookies", quantity: 100 },
        { _id: "2019Q2", store: "B", item: "Nuts", quantity: 100 },
        { _id: "2019Q2", store: "B", item: "Pie", quantity: 25 },
        { _id: "2019Q3", store: "A", item: "Cheese", quantity: 50 },
        { _id: "2019Q3", store: "A", item: "Chocolates", quantity: 125 },
        { _id: "2019Q3", store: "A", item: "Cookies", quantity: 200 },
        { _id: "2019Q3", store: "A", item: "Nuts", quantity: 80 },
        { _id: "2019Q3", store: "A", item: "Pie", quantity: 50 },
        { _id: "2019Q3", store: "B", item: "Cheese", quantity: 20 },
        { _id: "2019Q3", store: "B", item: "Chocolates", quantity: 150 },
        { _id: "2019Q3", store: "B", item: "Cookies", quantity: 100 },
        { _id: "2019Q3", store: "B", item: "Nuts", quantity: 30 },
        { _id: "2019Q3", store: "B", item: "Pie", quantity: 75 },
        { _id: "2019Q4", store: "A", item: "Cheese", quantity: 100 },
        { _id: "2019Q4", store: "A", item: "Chocolates", quantity: 200 },
        { _id: "2019Q4", store: "A", item: "Cookies", quantity: 500 },
        { _id: "2019Q4", store: "A", item: "Nuts", quantity: 100 },
        { _id: "2019Q4", store: "A", item: "Pie", quantity: 100 },
        { _id: "2019Q4", store: "B", item: "Cheese", quantity: 100 },
        { _id: "2019Q4", store: "B", item: "Chocolates", quantity: 300 },
        { _id: "2019Q4", store: "B", item: "Cookies", quantity: 400 },
        { _id: "2019Q4", store: "B", item: "Nuts", quantity: 200 },
        { _id: "2019Q4", store: "B", item: "Pie", quantity: 100 },
      ]);
    });
  });
});
