import test from 'tape'
import mingo from '../../lib'

test('$bucketAuto piepline operator', function (t) {

  let artwork = [
    {
      "_id": 1, "title": "The Pillars of Society", "artist": "Grosz", "year": 1926,
      "price": 199.99,
      "dimensions": { "height": 39, "width": 21, "units": "in" }
    },
    {
      "_id": 2, "title": "Melancholy III", "artist": "Munch", "year": 1902,
      "price": 280.00,
      "dimensions": { "height": 49, "width": 32, "units": "in" }
    },
    {
      "_id": 3, "title": "Dancer", "artist": "Miro", "year": 1925,
      "price": 76.04,
      "dimensions": { "height": 25, "width": 20, "units": "in" }
    },
    {
      "_id": 4, "title": "The Great Wave off Kanagawa", "artist": "Hokusai",
      "price": 167.30,
      "dimensions": { "height": 24, "width": 36, "units": "in" }
    },
    {
      "_id": 5, "title": "The Persistence of Memory", "artist": "Dali", "year": 1931,
      "price": 483.00,
      "dimensions": { "height": 20, "width": 24, "units": "in" }
    },
    {
      "_id": 6, "title": "Composition VII", "artist": "Kandinsky", "year": 1913,
      "price": 385.00,
      "dimensions": { "height": 30, "width": 46, "units": "in" }
    },
    {
      "_id": 7, "title": "The Scream", "artist": "Munch",
      "price": 159.00,
      "dimensions": { "height": 24, "width": 18, "units": "in" }
    },
    {
      "_id": 8, "title": "Blue Flower", "artist": "O'Keefe", "year": 1918,
      "price": 118.42,
      "dimensions": { "height": 24, "width": 20, "units": "in" }
    }
  ]

  let result = mingo.aggregate(artwork, [
    {
      $bucketAuto: {
        groupBy: "$price",
        buckets: 4
      }
    }
  ])

  t.deepEqual(result, [
    {
      "_id": {
        "min": 76.04,
        "max": 159.00
      },
      "count": 2
    },
    {
      "_id": {
        "min": 159.00,
        "max": 199.99
      },
      "count": 2
    },
    {
      "_id": {
        "min": 199.99,
        "max": 385.00
      },
      "count": 2
    },
    {
      "_id": {
        "min": 385.00,
        "max": 483.00
      },
      "count": 2
    }
  ], 'can apply $bucketAuto operator')

  let things = []
  for (let i = 0; i < 100; i++) {
    things.push({ _id: i })
  }

  result = mingo.aggregate(things, [
    {
      $bucketAuto: {
        groupBy: "$_id",
        buckets: 5
      }
    }
  ])

  t.deepEqual(result, [
    { "_id": { "min": 0, "max": 20 }, "count": 20 },
    { "_id": { "min": 20, "max": 40 }, "count": 20 },
    { "_id": { "min": 40, "max": 60 }, "count": 20 },
    { "_id": { "min": 60, "max": 80 }, "count": 20 },
    { "_id": { "min": 80, "max": 99 }, "count": 20 }
  ], "can apply $bucketAuto with nil granularity")

  t.end()
})