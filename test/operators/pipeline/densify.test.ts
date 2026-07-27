import { describe, expect, it } from "vitest";

import { aggregate } from "../../../src";
import { testPath } from "../../support";

const exampleData = [
  {
    altitude: 600,
    variety: "Arabica Typica",
    score: 68.3
  },
  {
    altitude: 750,
    variety: "Arabica Typica",
    score: 69.5
  },
  {
    altitude: 950,
    variety: "Arabica Typica",
    score: 70.5
  },
  {
    altitude: 1250,
    variety: "Gesha",
    score: 88.15
  },
  {
    altitude: 1700,
    variety: "Gesha",
    score: 95.5,
    price: 1029
  }
];

describe(testPath(import.meta.url), () => {
  it("passes: Densify Time Series Data", () => {
    const res = aggregate(
      [
        {
          metadata: { sensorId: 5578, type: "temperature" },
          timestamp: new Date("2021-05-18T00:00:00.000Z"),
          temp: 12
        },
        {
          metadata: { sensorId: 5578, type: "temperature" },
          timestamp: new Date("2021-05-18T04:00:00.000Z"),
          temp: 11
        },
        {
          metadata: { sensorId: 5578, type: "temperature" },
          timestamp: new Date("2021-05-18T08:00:00.000Z"),
          temp: 11
        },
        {
          metadata: { sensorId: 5578, type: "temperature" },
          timestamp: new Date("2021-05-18T12:00:00.000Z"),
          temp: 12
        }
      ],
      [
        {
          $densify: {
            field: "timestamp",
            range: {
              step: 1,
              unit: "hour",
              bounds: [
                new Date("2021-05-18T00:00:00.000Z"),
                new Date("2021-05-18T08:00:00.000Z")
              ]
            }
          }
        }
      ]
    );

    expect(res).toEqual([
      {
        metadata: { sensorId: 5578, type: "temperature" },
        timestamp: new Date("2021-05-18T00:00:00.000Z"),
        temp: 12
      },
      { timestamp: new Date("2021-05-18T01:00:00.000Z") },
      { timestamp: new Date("2021-05-18T02:00:00.000Z") },
      { timestamp: new Date("2021-05-18T03:00:00.000Z") },
      {
        metadata: { sensorId: 5578, type: "temperature" },
        timestamp: new Date("2021-05-18T04:00:00.000Z"),
        temp: 11
      },
      { timestamp: new Date("2021-05-18T05:00:00.000Z") },
      { timestamp: new Date("2021-05-18T06:00:00.000Z") },
      { timestamp: new Date("2021-05-18T07:00:00.000Z") },
      {
        metadata: { sensorId: 5578, type: "temperature" },
        timestamp: new Date("2021-05-18T08:00:00.000Z"),
        temp: 11
      },
      {
        metadata: { sensorId: 5578, type: "temperature" },
        timestamp: new Date("2021-05-18T12:00:00.000Z"),
        temp: 12
      }
    ]);
  });

  it("passes: Densify the Full Range of Values", () => {
    const res = aggregate(exampleData, [
      {
        $densify: {
          field: "altitude",
          partitionByFields: ["variety"],
          range: {
            bounds: "full",
            step: 200
          }
        }
      }
    ]);

    expect(res).toEqual([
      {
        altitude: 600,
        variety: "Arabica Typica",
        score: 68.3
      },
      {
        altitude: 750,
        variety: "Arabica Typica",
        score: 69.5
      },
      { variety: "Arabica Typica", altitude: 800 },
      {
        altitude: 950,
        variety: "Arabica Typica",
        score: 70.5
      },
      { variety: "Gesha", altitude: 600 },
      { variety: "Gesha", altitude: 800 },
      { variety: "Gesha", altitude: 1000 },
      { variety: "Gesha", altitude: 1200 },
      {
        altitude: 1250,
        variety: "Gesha",
        score: 88.15
      },
      { variety: "Gesha", altitude: 1400 },
      { variety: "Gesha", altitude: 1600 },
      {
        altitude: 1700,
        variety: "Gesha",
        score: 95.5,
        price: 1029
      },
      { variety: "Arabica Typica", altitude: 1000 },
      { variety: "Arabica Typica", altitude: 1200 },
      { variety: "Arabica Typica", altitude: 1400 },
      { variety: "Arabica Typica", altitude: 1600 }
    ]);
  });

  it("passes: Densify Values within Each Partition", () => {
    const res = aggregate(exampleData, [
      {
        $densify: {
          field: "altitude",
          partitionByFields: ["variety"],
          range: {
            bounds: "partition",
            step: 200
          }
        }
      }
    ]);

    expect(res).toEqual([
      {
        altitude: 600,
        variety: "Arabica Typica",
        score: 68.3
      },
      {
        altitude: 750,
        variety: "Arabica Typica",
        score: 69.5
      },
      { variety: "Arabica Typica", altitude: 800 },
      {
        altitude: 950,
        variety: "Arabica Typica",
        score: 70.5
      },
      {
        altitude: 1250,
        variety: "Gesha",
        score: 88.15
      },
      { variety: "Gesha", altitude: 1450 },
      { variety: "Gesha", altitude: 1650 },
      {
        altitude: 1700,
        variety: "Gesha",
        score: 95.5,
        price: 1029
      }
    ]);
  });

  it("Densify Unpartitioned Input", () => {
    const res = aggregate(exampleData, [
      {
        $densify: {
          field: "altitude",
          range: {
            bounds: "full",
            step: 200
          }
        }
      }
    ]);

    expect(res).toEqual([
      { altitude: 600, variety: "Arabica Typica", score: 68.3 },
      { altitude: 750, variety: "Arabica Typica", score: 69.5 },
      { altitude: 800 },
      { altitude: 950, variety: "Arabica Typica", score: 70.5 },
      { altitude: 1000 },
      { altitude: 1200 },
      { altitude: 1250, variety: "Gesha", score: 88.15 },
      { altitude: 1400 },
      { altitude: 1600 },
      { altitude: 1700, variety: "Gesha", score: 95.5, price: 1029 }
    ]);
  });
});
