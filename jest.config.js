/* eslint-disable */
// See: https://jestjs.io/docs/en/configuration.html

module.exports = {
  // Indicates whether the coverage information should be collected while executing the test
  collectCoverage: true,

  // An object that configures minimum threshold enforcement for coverage results
  coverageThreshold: {
    global: { lines: 98 },
  },

  // A preset that is used as a base for Jest's configuration.
  preset: "ts-jest",

  testMatch: ["**/__tests__/**/*.test.ts", "**/?(*.)+(spec|test).ts"],
};
