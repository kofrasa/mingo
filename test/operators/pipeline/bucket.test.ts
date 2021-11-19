import * as samples from "../../support";

samples.runTestPipeline("operators/pipeline/bucket", [
  {
    message: "can apply $bucket operator",
    input: [
      {
        _id: 1,
        title: "The Pillars of Society",
        artist: "Grosz",
        year: 1926,
        price: 199.99,
        tags: ["painting", "satire", "Expressionism", "caricature"],
      },
      {
        _id: 2,
        title: "Melancholy III",
        artist: "Munch",
        year: 1902,
        price: 280.0,
        tags: ["woodcut", "Expressionism"],
      },
      {
        _id: 3,
        title: "Dancer",
        artist: "Miro",
        year: 1925,
        price: 76.04,
        tags: ["oil", "Surrealism", "painting"],
      },
      {
        _id: 4,
        title: "The Great Wave off Kanagawa",
        artist: "Hokusai",
        price: 167.3,
        tags: ["woodblock", "ukiyo-e"],
      },
      {
        _id: 5,
        title: "The Persistence of Memory",
        artist: "Dali",
        year: 1931,
        price: 483.0,
        tags: ["Surrealism", "painting", "oil"],
      },
      {
        _id: 6,
        title: "Composition VII",
        artist: "Kandinsky",
        year: 1913,
        price: 385.0,
        tags: ["oil", "painting", "abstract"],
      },
      {
        _id: 7,
        title: "The Scream",
        artist: "Munch",
        year: 1893,
        tags: ["Expressionism", "painting", "oil"],
      },
      {
        _id: 8,
        title: "Blue Flower",
        artist: "O'Keefe",
        year: 1918,
        price: 118.42,
        tags: ["abstract", "painting"],
      },
    ],
    pipeline: [
      {
        $bucket: {
          groupBy: "$price",
          boundaries: [0, 200, 400],
          default: "Other",
          output: {
            count: { $sum: 1 },
            titles: { $push: "$title" },
          },
        },
      },
    ],
    expected: [
      {
        _id: 0,
        count: 4,
        titles: [
          "The Pillars of Society",
          "Dancer",
          "The Great Wave off Kanagawa",
          "Blue Flower",
        ],
      },
      {
        _id: 200,
        count: 2,
        titles: ["Melancholy III", "Composition VII"],
      },
      {
        _id: "Other",
        count: 2,
        titles: ["The Persistence of Memory", "The Scream"],
      },
    ],
  },
]);
