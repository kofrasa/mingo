import { runTest, testPath } from "../../../support";

const team = [
  { name: "pat", age: 30, address: { street: "12 Baker St", city: "London" } },
  {
    name: "dallas",
    age: 36,
    address: { street: "12 Cowper St", city: "Palo Alto" }
  },
  {
    name: "charlie",
    age: 42,
    address: { street: "12 French St", city: "New Brunswick" }
  }
];

runTest(testPath(import.meta.url), {
  $sortArray: [
    [{ input: null, sortBy: 1 }, null],
    [{ input: "invalid", sortBy: 1 }, Error("resolve to array")],
    [{ input: [1, 2, 3], sortBy: -1 }, [3, 2, 1]],
    [
      {
        input: team,
        sortBy: { name: 1 }
      },

      [
        {
          name: "charlie",
          age: 42,
          address: { street: "12 French St", city: "New Brunswick" }
        },
        {
          name: "dallas",
          age: 36,
          address: { street: "12 Cowper St", city: "Palo Alto" }
        },
        {
          name: "pat",
          age: 30,
          address: { street: "12 Baker St", city: "London" }
        }
      ]
    ],
    [
      {
        $sortArray: {
          input: team,
          sortBy: { "address.city": -1 }
        }
      },
      [
        {
          name: "dallas",
          age: 36,
          address: { street: "12 Cowper St", city: "Palo Alto" }
        },
        {
          name: "charlie",
          age: 42,
          address: { street: "12 French St", city: "New Brunswick" }
        },
        {
          name: "pat",
          age: 30,
          address: { street: "12 Baker St", city: "London" }
        }
      ]
    ],
    [
      {
        $sortArray: {
          input: team,
          sortBy: { age: -1, name: 1 }
        }
      },
      [
        {
          name: "charlie",
          age: 42,
          address: { street: "12 French St", city: "New Brunswick" }
        },
        {
          name: "dallas",
          age: 36,
          address: { street: "12 Cowper St", city: "Palo Alto" }
        },
        {
          name: "pat",
          age: 30,
          address: { street: "12 Baker St", city: "London" }
        }
      ]
    ],
    [
      {
        $sortArray: {
          input: [1, 4, 1, 6, 12, 5],
          sortBy: 1
        }
      },
      [1, 1, 4, 5, 6, 12]
    ]
  ]
});
