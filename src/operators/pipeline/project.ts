import {
  ComputeOptions,
  computeValue,
  getOperator,
  OperatorType,
  Options
} from "../../core";
import { Iterator } from "../../lazy";
import { AnyVal, Callback, Predicate, RawObject } from "../../types";
import {
  assert,
  ensureArray,
  filterMissing,
  has,
  inArray,
  into,
  isEmpty,
  isNil,
  isNumber,
  isObject,
  isOperator,
  isString,
  merge,
  notInArray,
  removeValue,
  resolveGraph,
  setValue
} from "../../util";

/**
 * Reshapes a document stream.
 * $project can rename, add, or remove fields as well as create computed values and sub-documents.
 *
 * @param collection
 * @param expr
 * @param opt
 * @returns {Array}
 */
export function $project(
  collection: Iterator,
  expr: RawObject,
  options: Options
): Iterator {
  if (isEmpty(expr)) return collection;

  // result collection
  let expressionKeys = Object.keys(expr);
  let idOnlyExcluded = false;

  // validate inclusion and exclusion
  validateExpression(expr, options);

  const ID_KEY = options.idKey;

  if (inArray(expressionKeys, ID_KEY)) {
    const id = expr[ID_KEY];
    if (id === 0 || id === false) {
      expressionKeys = expressionKeys.filter(
        notInArray.bind(null, [ID_KEY]) as Predicate<AnyVal>
      );
      idOnlyExcluded = expressionKeys.length == 0;
    }
  } else {
    // if not specified the add the ID field
    expressionKeys.push(ID_KEY);
  }

  const copts = ComputeOptions.init(options);
  return collection.map(((obj: RawObject) =>
    processObject(
      obj,
      expr,
      copts.update(obj),
      expressionKeys,
      idOnlyExcluded
    )) as Callback);
}

/**
 * Process the expression value for $project operators
 *
 * @param {Object} obj The object to use as options
 * @param {Object} expr The experssion object of $project operator
 * @param {Array} expressionKeys The key in the 'expr' object
 * @param {Boolean} idOnlyExcluded Boolean value indicating whether only the ID key is excluded
 */
function processObject(
  obj: RawObject,
  expr: RawObject,
  options: ComputeOptions,
  expressionKeys: string[],
  idOnlyExcluded: boolean
): RawObject {
  let newObj = {};
  let foundSlice = false;
  let foundExclusion = false;
  const dropKeys: string[] = [];

  if (idOnlyExcluded) {
    dropKeys.push(options.idKey);
  }

  for (const key of expressionKeys) {
    // final computed value of the key
    let value: AnyVal = undefined;

    // expression to associate with key
    const subExpr = expr[key];

    if (key !== options.idKey && inArray([0, false], subExpr)) {
      foundExclusion = true;
    }

    if (key === options.idKey && isEmpty(subExpr)) {
      // tiny optimization here to skip over id
      value = obj[key];
    } else if (isString(subExpr)) {
      value = computeValue(obj, subExpr, key, options);
    } else if (inArray([1, true], subExpr)) {
      // For direct projections, we use the resolved object value
    } else if (subExpr instanceof Array) {
      value = subExpr.map(v => {
        const r = computeValue(obj, v, null, options);
        if (isNil(r)) return null;
        return r;
      });
    } else if (isObject(subExpr)) {
      const subExprObj = subExpr as RawObject;
      const subExprKeys = Object.keys(subExpr);
      const operator = subExprKeys.length == 1 ? subExprKeys[0] : "";

      // first try a projection operator
      const call = getOperator(OperatorType.PROJECTION, operator);
      if (call) {
        // apply the projection operator on the operator expression for the key
        if (operator === "$slice") {
          // $slice is handled differently for aggregation and projection operations
          if (ensureArray(subExprObj[operator]).every(isNumber)) {
            // $slice for projection operation
            value = call(obj, subExprObj[operator], key, options);
            foundSlice = true;
          } else {
            // $slice for aggregation operation
            value = computeValue(obj, subExprObj, key, options);
          }
        } else {
          value = call(obj, subExprObj[operator], key, options);
        }
      } else if (isOperator(operator)) {
        // compute if operator key
        value = computeValue(obj, subExprObj[operator], operator, options);
      } else if (has(obj, key)) {
        // compute the value for the sub expression for the key
        validateExpression(subExprObj, options);
        let target = obj[key];
        if (target instanceof Array) {
          value = target.map((o: RawObject) =>
            processObject(o, subExprObj, options, subExprKeys, false)
          );
        } else {
          target = isObject(target) ? target : obj;
          value = processObject(
            target as RawObject,
            subExprObj,
            options,
            subExprKeys,
            false
          );
        }
      } else {
        // compute the value for the sub expression for the key
        value = computeValue(obj, subExpr, null, options);
      }
    } else {
      dropKeys.push(key);
      continue;
    }

    // get value with object graph
    const objPathGraph = resolveGraph(obj, key, {
      preserveMissing: true
    }) as RawObject;

    // add the value at the path
    if (objPathGraph !== undefined) {
      merge(newObj, objPathGraph, {
        flatten: true
      });
    }

    // if computed add/or remove accordingly
    if (notInArray([0, 1, false, true], subExpr)) {
      if (value === undefined) {
        removeValue(newObj, key, { descendArray: true });
      } else {
        setValue(newObj, key, value);
      }
    }
  }

  // filter out all missing values preserved to support correct merging
  filterMissing(newObj);

  // For the following cases we include all keys on the object that were not explicitly excluded.
  //
  // 1. projection included $slice operator
  // 2. some fields were explicitly excluded
  // 3. only the id field was excluded
  if (foundSlice || foundExclusion || idOnlyExcluded) {
    newObj = into({}, obj, newObj);
    if (dropKeys.length > 0) {
      for (const k of dropKeys) {
        removeValue(newObj, k, { descendArray: true });
      }
    }
  }

  return newObj;
}

/**
 * Validate inclusion and exclusion values in expression
 *
 * @param {Object} expr The expression given for the projection
 */
function validateExpression(expr: RawObject, options: Options): void {
  const check = [false, false];
  for (const [k, v] of Object.entries(expr)) {
    if (k === options?.idKey) return;
    if (v === 0 || v === false) {
      check[0] = true;
    } else if (v === 1 || v === true) {
      check[1] = true;
    }
    assert(
      !(check[0] && check[1]),
      "Projection cannot have a mix of inclusion and exclusion."
    );
  }
}
