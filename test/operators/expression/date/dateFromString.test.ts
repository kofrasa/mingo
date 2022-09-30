import { runTest, testPath } from "../../../support";

runTest(testPath(__filename), {
  $dateFromString: [
    [
      { dateString: "2017-02-08T12:10:40.787" },
      new Date("2017-02-08T12:10:40.787Z"),
    ],
    [
      { dateString: "2017-02-08T12:10:40.787Z" },
      new Date("2017-02-08T12:10:40.787Z"),
    ],
    [
      { dateString: "2017-02-08T12:10:40Z" },
      new Date("2017-02-08T12:10:40.000Z"),
    ],
    [{ dateString: "2017-02-08A" }, new Date("2017-02-07T23:00:00Z")],
    [{ dateString: "2017-02-08B" }, new Date("2017-02-07T22:00:00Z")],
    [{ dateString: "2017-02-08N" }, new Date("2017-02-08T01:00:00Z")],
    [{ dateString: "2017-02-08Y" }, new Date("2017-02-08T12:00:00Z")],
    [
      { dateString: "2017-02-08T12:10:40.787", timezone: "-0500" },
      new Date("2017-02-08T17:10:40.787Z"),
    ],
    [{ dateString: "2017-02-08" }, new Date("2017-02-08T00:00:00Z")],
    [
      {
        dateString: "06-15-2018",
        format: "%m-%d-%Y",
      },
      new Date("2018-06-15T00:00:00Z"),
    ],
    [
      {
        dateString: "15-06-2018",
        format: "%d-%m-%Y",
      },
      new Date("2018-06-15T00:00:00Z"),
    ],
    [
      {
        dateString: "2017-02-09T03:35:02.055",
        timezone: "-0500",
      },
      new Date("2017-02-09T08:35:02.055Z"),
    ],
  ],
});
