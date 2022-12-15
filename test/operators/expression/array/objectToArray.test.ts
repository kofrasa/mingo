import * as support from "../../../support";

support.runTest(support.testPath(__filename), {
  $objectToArray: [
    [
      { item: "foo", qty: 25 },
      [
        { k: "item", v: "foo" },
        { k: "qty", v: 25 },
      ],
    ],
    [
      {
        item: "foo",
        qty: 25,
        size: { len: 25, w: 10, uom: "cm" },
      },
      [
        { k: "item", v: "foo" },
        { k: "qty", v: 25 },
        { k: "size", v: { len: 25, w: 10, uom: "cm" } },
      ],
    ],
  ],
});
