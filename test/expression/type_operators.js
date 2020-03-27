var test = require('tape')
var mingo = require('../../es5')

test('Type Conversion Operators', function (t) {

  // $toString
  zipConversionStage = {
    $addFields: {
      convertedZipCode: { $toString: "$zipcode" }
    }
  }

  // Define stage to sort documents by the converted zipcode

  sortStage = {
    $sort: { "convertedZipCode": 1 }
  }

  var result = mingo.aggregate([
    { _id: 1, item: "apple",  qty: 5, zipcode: 12345 },
    { _id: 2, item: "pie",  qty: 10, zipcode: 11111 },
    { _id: 3, item: "ice cream",  zipcode: "12345" },
    { _id: 4, item: "almonds", qty: 2, zipcode: "12345-0030" },
  ], [
    zipConversionStage,
    sortStage
  ])

  t.deepEqual([
    { "_id" : 2, "item" : "pie", "qty" : 10, "zipcode" : 11111, "convertedZipCode" : "11111" },
    { "_id" : 1, "item" : "apple", "qty" : 5, "zipcode" : 12345, "convertedZipCode" : "12345" },
    { "_id" : 3, "item" : "ice cream", "zipcode" : "12345", "convertedZipCode" : "12345" },
    { "_id" : 4, "item" : "almonds", "qty" : 2, "zipcode" : "12345-0030", "convertedZipCode" : "12345-0030" }
  ], result, 'can apply $toString operator')

  // $toInt, $toLong, $toDouble, $toDecimal
  // Define stage to add convertedPrice and convertedQty fields with the converted price and qty values

  priceQtyConversionStage = {
    $addFields: {
      convertedPrice: { $toDecimal: "$price" },
      convertedQty: { $toInt: "$qty" },
    }
  };

  // Define stage to calculate total price by multiplying convertedPrice and convertedQty fields


  totalPriceCalculationStage = {
    $project: { item: 1, totalPrice: { $multiply: [ "$convertedPrice", "$convertedQty" ] } }
  };

  result = mingo.aggregate([
    { _id: 1, item: "apple", qty: 5, price: 10 },
    { _id: 2, item: "pie", qty: 10, price: 20.0 },
    { _id: 3, item: "ice cream", qty: 2, price: "4.99" },
    { _id: 4, item: "almonds" ,  qty: 5, price: 5 }
  ], [
    priceQtyConversionStage,
    totalPriceCalculationStage
  ])

  t.deepEqual([
    { "_id" : 1, "item" : "apple", "totalPrice" :  50.0000000000000 },
    { "_id" : 2, "item" : "pie", "totalPrice" : 200.0 },
    { "_id" : 3, "item" : "ice cream", "totalPrice" : 9.98 },
    { "_id" : 4, "item" : "almonds", "totalPrice" : 25.00000000000000 }
  ], result, 'can apply $toInt/$toLong and $toDouble/$toDecimal')

  // Define stage to add convertedDate field with the converted order_date value

  dateConversionStage = {
    $addFields: {
      convertedDate: { $toDate: "$order_date" }
    }
  };

  // Define stage to sort documents by the converted date

  sortStage = {
    $sort: { "convertedDate": 1 }
  };

  result = mingo.aggregate([
    { _id: 1, item: "apple", qty: 5, order_date: new Date("2018-03-10") },
    { _id: 2, item: "pie", qty: 10,  order_date: new Date("2018-03-12")},
    { _id: 3, item: "ice cream", qty: 2, price: "4.99", order_date: "2018-03-05" },
    { _id: 4, item: "almonds" ,  qty: 5, price: 5,  order_date: "2018-03-05"}
  ], [
    dateConversionStage,
    sortStage
  ])

  t.deepEqual(result, [
    { "_id" : 3, "item" : "ice cream", "qty" : 2, "price" : "4.99", "order_date" : "2018-03-05", "convertedDate" : new Date("2018-03-05T00:00:00Z") },
    { "_id" : 4, "item" : "almonds", "qty" : 5, "price" : 5, "order_date" : "2018-03-05", "convertedDate" : new Date("2018-03-05T00:00:00Z") },
    { "_id" : 1, "item" : "apple", "qty" : 5, "order_date" : new Date("2018-03-10T00:00:00Z"), "convertedDate" : new Date("2018-03-10T00:00:00Z") },
    { "_id" : 2, "item" : "pie", "qty" : 10, "order_date" : new Date("2018-03-12T00:00:00Z"), "convertedDate" : new Date("2018-03-12T00:00:00Z") }
  ], "can apply $toDate")

  // Test $convert operator

  data = [
    { _id: 1, item: "apple", qty: 5, price: 10 },
    { _id: 2, item: "pie", qty: 10, price: Number("20.0") },
    { _id: 3, item: "ice cream", qty: 2, price: "4.99" },
    { _id: 4, item: "almonds" },
    { _id: 5, item: "bananas", qty: 5000000000, price: Number("1.25") }
  ]

  // Define stage to add convertedPrice and convertedQty fields with the converted price and qty values
  // If price or qty values are missing, the conversion returns a value of decimal value or int value of 0.
  // If price or qty values cannot be converted, the conversion returns a string

  priceQtyConversionStage = {
    $addFields: {
      convertedPrice: { $convert: { input: "$price", to: "decimal", onError: "Error", onNull: Number("0") } },
      convertedQty: { $convert: {
          input: "$qty", to: "int",
          onError:{$concat:["Could not convert ", {$toString:"$qty"}, " to type integer."]},
          onNull: Number("0")
      } },
    }
  };

  totalPriceCalculationStage = {
    $project: { totalPrice: {
      $switch: {
        branches: [
          { case: { $eq: [ { $type: "$convertedPrice" }, "string" ] }, then: "NaN" },
          { case: { $eq: [ { $type: "$convertedQty" }, "string" ] }, then: "NaN" },
        ],
        default: { $multiply: [ "$convertedPrice", "$convertedQty" ] }
      }
  } } };

  result = mingo.aggregate(data, [
    priceQtyConversionStage,
    totalPriceCalculationStage
  ])

  t.deepEqual(result, [
    { "_id" : 1, "totalPrice" : Number("50.0000000000000") },
    { "_id" : 2, "totalPrice" : Number("200.0") },
    { "_id" : 3, "totalPrice" : Number("9.98") },
    { "_id" : 4, "totalPrice" : Number("0") },
    { "_id" : 5, "totalPrice" : 'NaN' }
  ], 'can apply $convert')

  t.end()
})
