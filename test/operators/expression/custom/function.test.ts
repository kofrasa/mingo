import "../../../../src/init/system";

import { aggregate } from "../../../../src";

describe("operators/expressions/custom/function", () => {
  describe("$function", () => {
    it("can run $function with arguments", () => {
      const data = [
        { _id: 1, name: "Miss Cheevous", scores: [10, 5, 10] },
        { _id: 2, name: "Miss Ann Thrope", scores: [10, 10, 10] },
        { _id: 3, name: "Mrs. Eppie Delta ", scores: [9, 8, 8] },
      ];

      const result = aggregate(data, [
        {
          $addFields: {
            isFound: {
              $function: {
                body: (name: string): boolean => name.length == 15,
                args: ["$name"],
                lang: "js",
              },
            },
            message: {
              $function: {
                body: function (name: string, scores: number[]) {
                  let total = 0;
                  scores.forEach((n) => (total += n));
                  return `Hello ${name}.  Your total score is ${total}.`;
                },
                args: ["$name", "$scores"],
                lang: "js",
              },
            },
          },
        },
      ]);

      expect(result).toEqual([
        {
          _id: 1,
          name: "Miss Cheevous",
          scores: [10, 5, 10],
          isFound: false,
          message: "Hello Miss Cheevous.  Your total score is 25.",
        },
        {
          _id: 2,
          name: "Miss Ann Thrope",
          scores: [10, 10, 10],
          isFound: true,
          message: "Hello Miss Ann Thrope.  Your total score is 30.",
        },
        {
          _id: 3,
          name: "Mrs. Eppie Delta ",
          scores: [9, 8, 8],
          isFound: false,
          message: "Hello Mrs. Eppie Delta .  Your total score is 25.",
        },
      ]);
    });
  });
});
