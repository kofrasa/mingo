// $setWindowFields -  https://docs.mongodb.com/manual/reference/operator/aggregation/setWindowFields/

import {
  AccumulatorOperator,
  getOperator,
  OperatorType,
  Options,
  WindowOperator,
} from "../../core";
import { compose, Iterator, Lazy } from "../../lazy";
import { AnyVal, RawArray, RawObject } from "../../types";
import { assert, isNumber, isOperator, isString } from "../../util";
import { $dateAdd } from "../expression";
import { $addFields, $group, $sort } from ".";
import { SetWindowFieldsInput, WindowOutputOption } from "./_internal";

/**
 * Randomly selects the specified number of documents from its input. The given iterator must have finite values
 *
 * @param  {Iterator} collection
 * @param  {Object} expr
 * @param  {Options} options
 * @return {*}
 */
export function $setWindowFields(
  collection: Iterator,
  expr: SetWindowFieldsInput,
  options?: Options
): Iterator {
  // validate inputs early since this can be an expensive operation.
  for (const outputExpr of Object.values(expr.output)) {
    const keys = Object.keys(outputExpr);
    const op = keys.find(isOperator);
    assert(
      !!getOperator(OperatorType.WINDOW, op) ||
        !!getOperator(OperatorType.ACCUMULATOR, op),
      `${op} is not a valid window operator`
    );

    assert(
      keys.length > 0 &&
        keys.length <= 2 &&
        (keys.length == 1 || keys.includes("window")),
      "$setWindowFields 'output' values should have a single window operator."
    );

    if (outputExpr?.window) {
      const { documents, range } = outputExpr.window;
      assert(
        (!!documents && !range) ||
          (!documents && !!range) ||
          (!documents && !range),
        "$setWindowFields 'output.window' option supports only one of 'documents' or 'range'."
      );
    }
  }

  // we sort first if required
  if (expr.sortBy) {
    collection = $sort(collection, expr.sortBy, options);
  }

  // then partition collection
  if (expr.partitionBy) {
    collection = $group(
      collection,
      {
        _id: expr.partitionBy,
        items: { $push: "$$CURRENT" },
      },
      options
    );
  } else {
    // single partition so we can keep the code uniform
    collection = Lazy([
      {
        _id: 0,
        items: collection.value(),
      },
    ]);
  }

  // transform values
  return collection.transform((partitions: RawArray) => {
    // let iteratorIndex = 0;
    const iterators: Iterator[] = [];
    const outputConfig: Array<{
      operatorName: string;
      func: {
        left: AccumulatorOperator | null;
        right: WindowOperator | null;
      };
      args: AnyVal;
      field: string;
      window: WindowOutputOption;
    }> = [];

    for (const [field, outputExpr] of Object.entries(expr.output)) {
      const operatorName = Object.keys(outputExpr).find(isOperator);
      outputConfig.push({
        operatorName,
        func: {
          left: getOperator(OperatorType.ACCUMULATOR, operatorName),
          right: getOperator(OperatorType.WINDOW, operatorName),
        },
        args: outputExpr[operatorName],
        field: field,
        window: outputExpr.window,
      });
    }

    // each parition maintains its own closure to process the documents in the window.
    partitions.forEach((group: { items: RawArray }) => {
      // get the items to process
      const items = group.items as RawObject[];

      // create an iterator per group.
      // we need the index of each document so we track it using a special field.
      let iterator = Lazy(items);

      // results map
      const windowResultMap: Record<string, (_: RawObject) => AnyVal> = {};

      for (const config of outputConfig) {
        const { func, args, field, window } = config;
        const makeResultFunc = (
          getItemsFn: (_: RawObject, i: number) => RawObject[]
        ) => {
          // closure for object index within the partition
          let index = -1;
          return (obj: RawObject) => {
            ++index;

            // process accumulator function
            if (func.left) {
              return func.left(getItemsFn(obj, index), args, options);
            }

            // OR process window function
            return func.right(
              obj,
              getItemsFn(obj, index),
              {
                parentExpr: expr,
                inputExpr: args,
                documentNumber: index + 1,
                field,
              },
              options
            );
          };
        };

        if (window) {
          const { documents, range, unit } = window;
          const boundary = documents || range;
          const begin = boundary[0];
          const end = boundary[1];

          if (boundary && (begin != "unbounded" || end != "unbounded")) {
            const toBeginIndex = (currentIndex: number): number => {
              if (begin == "current") return currentIndex;
              if (begin == "unbounded") return 0;
              return Math.max(begin + currentIndex, 0);
            };

            const toEndIndex = (currentIndex: number): number => {
              if (end == "current") return currentIndex + 1;
              if (end == "unbounded") return items.length;
              return end + currentIndex + 1;
            };

            const getItems = (
              current: RawObject,
              index: number
            ): RawObject[] => {
              // handle string boundaries or documents
              if (!!documents || boundary.every(isString)) {
                return items.slice(toBeginIndex(index), toEndIndex(index));
              }

              // handle range with numeric boundary values
              const sortKey = Object.keys(expr.sortBy)[0];
              let lower: number;
              let upper: number;

              if (unit) {
                // we are dealing with datetimes
                const getTime = (amount: number): number => {
                  return (
                    $dateAdd(current, {
                      startDate: new Date(current[sortKey] as Date),
                      unit,
                      amount,
                    }) as Date
                  ).getTime();
                };
                lower = isNumber(begin) ? getTime(begin) : -Infinity;
                upper = isNumber(end) ? getTime(end) : Infinity;
              } else {
                const currentValue = current[sortKey] as number;
                lower = isNumber(begin) ? currentValue + begin : -Infinity;
                upper = isNumber(end) ? currentValue + end : Infinity;
              }

              let array: RawObject[] = items;
              if (begin == "current") array = items.slice(index);
              if (end == "current") array = items.slice(0, index + 1);

              // look within the boundary and filter down
              return array.filter((o: RawObject) => {
                const value = o[sortKey];
                const n = +value;
                return n >= lower && n <= upper;
              });
            };

            windowResultMap[field] = makeResultFunc(getItems);
          }
        }

        // default action is to utilize the entire set of items
        if (!windowResultMap[field]) {
          windowResultMap[field] = makeResultFunc((_) => items);
        }

        // invoke add fields to get the desired behaviour using a custom function.
        iterator = $addFields(iterator, {
          [field]: {
            $function: {
              body: (obj: RawObject) => windowResultMap[field](obj),
              args: ["$$CURRENT"],
            },
          },
        });
      }

      // add to iterator list
      iterators.push(iterator);
    });

    return compose(...iterators);
  });
}
