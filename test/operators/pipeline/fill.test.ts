import * as samples from "../../support";

samples.runTestPipeline("operators/pipeline/fill", [
  {
    message: "Fill Missing Field Values with a Constant Value",
    pipeline: [
      {
        $fill: {
          output: {
            bootsSold: { value: 0 },
            sandalsSold: { value: 0 },
            sneakersSold: { value: 0 },
          },
        },
      },
    ],
    input: [
      {
        date: new Date("2022-02-02"),
        bootsSold: 10,
        sandalsSold: 20,
        sneakersSold: 12,
      },
      {
        date: new Date("2022-02-03"),
        bootsSold: 7,
        sneakersSold: 18,
      },
      {
        date: new Date("2022-02-04"),
        sneakersSold: 5,
      },
    ],
    expected: [
      {
        date: new Date("2022-02-02T00:00:00.000Z"),
        bootsSold: 10,
        sandalsSold: 20,
        sneakersSold: 12,
      },
      {
        date: new Date("2022-02-03T00:00:00.000Z"),
        bootsSold: 7,
        sneakersSold: 18,
        sandalsSold: 0,
      },
      {
        date: new Date("2022-02-04T00:00:00.000Z"),
        sneakersSold: 5,
        bootsSold: 0,
        sandalsSold: 0,
      },
    ],
  },
  {
    message: "Fill Missing Field Values with Linear Interpolation",
    pipeline: [
      {
        $fill: {
          sortBy: { time: 1 },
          output: {
            price: { method: "linear" },
          },
        },
      },
    ],
    input: [
      {
        time: new Date("2021-03-08T09:00:00.000Z"),
        price: 500,
      },
      {
        time: new Date("2021-03-08T10:00:00.000Z"),
      },
      {
        time: new Date("2021-03-08T11:00:00.000Z"),
        price: 515,
      },
      {
        time: new Date("2021-03-08T12:00:00.000Z"),
      },
      {
        time: new Date("2021-03-08T13:00:00.000Z"),
      },
      {
        time: new Date("2021-03-08T14:00:00.000Z"),
        price: 485,
      },
    ],
    expected: [
      {
        time: new Date("2021-03-08T09:00:00.000Z"),
        price: 500,
      },
      {
        time: new Date("2021-03-08T10:00:00.000Z"),
        price: 507.5,
      },
      {
        time: new Date("2021-03-08T11:00:00.000Z"),
        price: 515,
      },
      {
        time: new Date("2021-03-08T12:00:00.000Z"),
        price: 505,
      },
      {
        time: new Date("2021-03-08T13:00:00.000Z"),
        price: 495,
      },
      {
        time: new Date("2021-03-08T14:00:00.000Z"),
        price: 485,
      },
    ],
  },
  {
    message: "Fill Missing Field Values Based on the Last Observed Value",
    pipeline: [
      {
        $fill: {
          sortBy: { date: 1 },
          output: {
            score: { method: "locf" },
          },
        },
      },
    ],
    input: [
      {
        date: new Date("2021-03-08"),
        score: 90,
      },
      {
        date: new Date("2021-03-09"),
        score: 92,
      },
      {
        date: new Date("2021-03-10"),
      },
      {
        date: new Date("2021-03-11"),
      },
      {
        date: new Date("2021-03-12"),
        score: 85,
      },
      {
        date: new Date("2021-03-13"),
      },
    ],
    expected: [
      {
        date: new Date("2021-03-08T00:00:00.000Z"),
        score: 90,
      },
      {
        date: new Date("2021-03-09T00:00:00.000Z"),
        score: 92,
      },
      {
        date: new Date("2021-03-10T00:00:00.000Z"),
        score: 92,
      },
      {
        date: new Date("2021-03-11T00:00:00.000Z"),
        score: 92,
      },
      {
        date: new Date("2021-03-12T00:00:00.000Z"),
        score: 85,
      },
      {
        date: new Date("2021-03-13T00:00:00.000Z"),
        score: 85,
      },
    ],
  },
  {
    message: "Fill Data for Distinct Partitions",
    pipeline: [
      {
        $fill: {
          sortBy: { date: 1 },
          partitionBy: { restaurant: "$restaurant" },
          output: {
            score: { method: "locf" },
          },
        },
      },
    ],
    input: [
      {
        date: new Date("2021-03-08"),
        restaurant: "Joe's Pizza",
        score: 90,
      },
      {
        date: new Date("2021-03-08"),
        restaurant: "Sally's Deli",
        score: 75,
      },
      {
        date: new Date("2021-03-09"),
        restaurant: "Joe's Pizza",
        score: 92,
      },
      {
        date: new Date("2021-03-09"),
        restaurant: "Sally's Deli",
      },
      {
        date: new Date("2021-03-10"),
        restaurant: "Joe's Pizza",
      },
      {
        date: new Date("2021-03-10"),
        restaurant: "Sally's Deli",
        score: 68,
      },
      {
        date: new Date("2021-03-11"),
        restaurant: "Joe's Pizza",
        score: 93,
      },
      {
        date: new Date("2021-03-11"),
        restaurant: "Sally's Deli",
      },
    ],
    expected: [
      {
        date: new Date("2021-03-08T00:00:00.000Z"),
        restaurant: "Joe's Pizza",
        score: 90,
      },
      {
        date: new Date("2021-03-09T00:00:00.000Z"),
        restaurant: "Joe's Pizza",
        score: 92,
      },
      {
        date: new Date("2021-03-10T00:00:00.000Z"),
        restaurant: "Joe's Pizza",
        score: 92,
      },
      {
        date: new Date("2021-03-11T00:00:00.000Z"),
        restaurant: "Joe's Pizza",
        score: 93,
      },
      {
        date: new Date("2021-03-08T00:00:00.000Z"),
        restaurant: "Sally's Deli",
        score: 75,
      },
      {
        date: new Date("2021-03-09T00:00:00.000Z"),
        restaurant: "Sally's Deli",
        score: 75,
      },
      {
        date: new Date("2021-03-10T00:00:00.000Z"),
        restaurant: "Sally's Deli",
        score: 68,
      },
      {
        date: new Date("2021-03-11T00:00:00.000Z"),
        restaurant: "Sally's Deli",
        score: 68,
      },
    ],
  },
  {
    message: "Indicate if a Field was Populated Using $fill",
    pipeline: [
      {
        $set: {
          valueExisted: {
            $ifNull: [{ $toBool: { $toString: "$score" } }, false],
          },
        },
      },
      {
        $fill: {
          sortBy: { date: 1 },
          output: {
            score: { method: "locf" },
          },
        },
      },
    ],
    input: [
      {
        date: new Date("2021-03-08"),
        score: 90,
      },
      {
        date: new Date("2021-03-09"),
        score: 92,
      },
      {
        date: new Date("2021-03-10"),
      },
      {
        date: new Date("2021-03-11"),
      },
      {
        date: new Date("2021-03-12"),
        score: 85,
      },
      {
        date: new Date("2021-03-13"),
      },
    ],
    expected: [
      {
        date: new Date("2021-03-08T00:00:00.000Z"),
        score: 90,
        valueExisted: true,
      },
      {
        date: new Date("2021-03-09T00:00:00.000Z"),
        score: 92,
        valueExisted: true,
      },
      {
        date: new Date("2021-03-10T00:00:00.000Z"),
        valueExisted: false,
        score: 92,
      },
      {
        date: new Date("2021-03-11T00:00:00.000Z"),
        valueExisted: false,
        score: 92,
      },
      {
        date: new Date("2021-03-12T00:00:00.000Z"),
        score: 85,
        valueExisted: true,
      },
      {
        date: new Date("2021-03-13T00:00:00.000Z"),
        valueExisted: false,
        score: 85,
      },
    ],
  },
]);
