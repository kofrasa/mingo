import "../../../src/init/system";

import { aggregate } from "../../../src";

describe("operators/expressions/custom", () => {
  describe("$accumulator", () => {
    it("Use $accumulator to Implement the $avg Operator", () => {
      const result = aggregate(
        [
          { _id: 8751, title: "The Banquet", author: "Dante", copies: 2 },
          { _id: 8752, title: "Divine Comedy", author: "Dante", copies: 1 },
          { _id: 8645, title: "Eclogues", author: "Dante", copies: 2 },
          { _id: 7000, title: "The Odyssey", author: "Homer", copies: 10 },
          { _id: 7020, title: "Iliad", author: "Homer", copies: 10 },
        ],
        [
          {
            $group: {
              _id: "$author",
              avgCopies: {
                $accumulator: {
                  init: () => {
                    // Set the initial state
                    return { count: 0, sum: 0 };
                  },
                  accumulate: (
                    state: { sum: number; count: number },
                    numCopies: number
                  ) => {
                    // Define how to update the state
                    return {
                      count: state.count + 1,
                      sum: state.sum + numCopies,
                    };
                  },
                  accumulateArgs: ["$copies"], // Argument required by the accumulate function
                  finalize: (state: { sum: number; count: number }) => {
                    // After collecting the results from all documents,
                    return state.sum / state.count; // calculate the average
                  },
                  lang: "js",
                },
              },
            },
          },
        ]
      );
      expect(result).toEqual([
        { _id: "Dante", avgCopies: 1.6666666666666667 },
        { _id: "Homer", avgCopies: 10 },
      ]);
    });

    it("Use initArgs to Vary the Initial State by Group", () => {
      for (const [key, expected] of Object.entries({
        Bettles: [
          {
            _id: { city: "Bettles" },
            restaurants: ["Food Fury", "Meal Macro", "Big Crisp"],
          },
          { _id: { city: "Onida" }, restaurants: ["The Wrap"] },
          { _id: { city: "Pyote" }, restaurants: ["Crave"] },
        ],
        Onida: [
          { _id: { city: "Bettles" }, restaurants: ["Food Fury"] },
          {
            _id: { city: "Onida" },
            restaurants: ["The Wrap", "Spice Attack", "Soup City"],
          },
          { _id: { city: "Pyote" }, restaurants: ["Crave"] },
        ],

        Pyote: [
          { _id: { city: "Bettles" }, restaurants: ["Food Fury"] },
          { _id: { city: "Onida" }, restaurants: ["The Wrap"] },
          { _id: { city: "Pyote" }, restaurants: ["Crave", "The Gala"] },
        ],

        unknown: [
          { _id: { city: "Bettles" }, restaurants: ["Food Fury"] },
          { _id: { city: "Onida" }, restaurants: ["The Wrap"] },
          { _id: { city: "Pyote" }, restaurants: ["Crave"] },
        ],
      })) {
        const result = aggregate(
          [
            { _id: 1, name: "Food Fury", city: "Bettles", cuisine: "American" },
            { _id: 2, name: "Meal Macro", city: "Bettles", cuisine: "Chinese" },
            { _id: 3, name: "Big Crisp", city: "Bettles", cuisine: "Latin" },
            { _id: 4, name: "The Wrap", city: "Onida", cuisine: "American" },
            { _id: 5, name: "Spice Attack", city: "Onida", cuisine: "Latin" },
            { _id: 6, name: "Soup City", city: "Onida", cuisine: "Chinese" },
            { _id: 7, name: "Crave", city: "Pyote", cuisine: "American" },
            { _id: 8, name: "The Gala", city: "Pyote", cuisine: "Chinese" },
          ],
          [
            {
              $group: {
                _id: { city: "$city" },
                restaurants: {
                  $accumulator: {
                    init: (city: string, userProfileCity: string) => {
                      // Set the initial state
                      return {
                        max: city === userProfileCity ? 3 : 1, // If the group matches the user's city, return 3 restaurants
                        restaurants: [], // else, return 1 restaurant
                      };
                    },
                    initArgs: ["$city", key], // Argument to pass to the init function
                    accumulate: (
                      state: { restaurants: string[]; max: number },
                      restaurantName: string
                    ) => {
                      // Define how to update the state
                      if (state.restaurants.length < state.max) {
                        state.restaurants.push(restaurantName);
                      }
                      return state;
                    },
                    accumulateArgs: ["$name"], // Argument required by the accumulate function
                    finalize: (state: {
                      max: number;
                      restaurants: string[];
                    }) => {
                      // Adjust the state to only return field we need
                      return state.restaurants;
                    },
                  },
                },
              },
            },
          ]
        );
        expect(result).toEqual(expected);
      }
    });
  });

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
