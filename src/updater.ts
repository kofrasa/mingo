import { ComputeOptions } from "./core/_internal";
import { Iterator, Lazy } from "./lazy";
import * as booleanOperators from "./operators/expression/boolean";
import * as comparisonOperators from "./operators/expression/comparison";
import { $addFields } from "./operators/pipeline/addFields";
import { $project } from "./operators/pipeline/project";
import { $replaceRoot } from "./operators/pipeline/replaceRoot";
import { $replaceWith } from "./operators/pipeline/replaceWith";
import { $set } from "./operators/pipeline/set";
import { $sort } from "./operators/pipeline/sort";
import { $unset } from "./operators/pipeline/unset";
import * as queryOperators from "./operators/query";
import * as updateOperators from "./operators/update";
import { buildParams, SingleKeyRecord } from "./operators/update/_internal";
import { Query } from "./query";
import {
  Any,
  AnyObject,
  Callback,
  CollationSpec,
  Criteria,
  Options,
  SortSpec,
  UpdateExpr,
  UpdateOperator
} from "./types";
import {
  assert,
  cloneDeep,
  ensureArray,
  hashCode,
  isArray,
  isEqual,
  PathValidator,
  resolve
} from "./util/_internal";

const UPDATE_OPERATORS = updateOperators as Record<string, UpdateOperator>;

const PIPELINE_OPERATORS = {
  $addFields,
  $set,
  $project,
  $unset,
  $replaceRoot,
  $replaceWith
} as const; //as Record<string, PipelineOperator>;

type StageName = keyof typeof PIPELINE_OPERATORS;

export type PipelineStage =
  | { $addFields: AnyObject }
  | { $set: AnyObject }
  | { $project: AnyObject }
  | { $unset: string | string[] }
  | { $replaceRoot: { newRoot: AnyObject } }
  | { $replaceWith: AnyObject };

export interface Modifier<T> {
  $addToSet?: UpdateExpr<T>;
  $bit?: UpdateExpr<T, SingleKeyRecord<"and" | "or" | "xor", number>>;
  $currentDate?: UpdateExpr<T, true | { $type: "date" | "timestamp" }>;
  $inc?: UpdateExpr<T, number>;
  $max?: UpdateExpr<T>;
  $min?: UpdateExpr<T>;
  $mul?: UpdateExpr<T, number>;
  $pop?: UpdateExpr<T, 1 | -1>;
  $pull?: UpdateExpr<T>;
  $pullAll?: UpdateExpr<T, Any[]>;
  $push?: UpdateExpr<T>;
  $rename?: UpdateExpr<T, string>;
  $set?: UpdateExpr<T>;
  $unset?: UpdateExpr<T, "">;
}

/**
 * Supported cloning modes.
 * - "deep": Performs a recursive deep clone of the object.
 * - "copy": Performs a shallow copy of the object. @default
 * - "none": No cloning. Uses the value as given. NOT RECOMMENDED.
 */
export type CloneMode = "deep" | "copy" | "none";

/** Extra configuration to customize the update operation */
export interface UpdateConfig {
  /** An array of filter documents that determine which array elements to modify for an update operation on an array field. */
  arrayFilters?: AnyObject[];
  /** Determines how to set values to fields. */
  cloneMode?: CloneMode;
  /** {@link updateOne} updates the first document in the sort order specified by this argument. */
  sort?: SortSpec;
  /** The collation to use for the operation. Merged into {@link Options.collation} when specified. */
  collation?: CollationSpec;
  /** A document with a list of variables. Merged into {@link Options.variables} when specified. */
  let?: AnyObject;
}

/**
 * Updates the given object with the expression.
 *
 * @param obj The object to update.
 * @param modifier The modifications to apply.
 * @param arrayFilters Filters to apply to nested items.
 * @param condition Conditions to validate before performing update.
 * @param options Update options to override defaults.
 * @returns {string[]} A list of modified field paths in the object.
 */
export function update<T extends AnyObject>(
  obj: T,
  modifier: Modifier<T>,
  arrayFilters?: AnyObject[],
  condition?: Criteria<T>,
  options?: {
    cloneMode?: CloneMode;
    queryOptions?: Partial<Options>;
  }
): string[] {
  // NOTE: pipeline operators are not supported for this function since they may replace the entire object within the collection.
  const docs = [obj];
  const res = updateOne<T>(
    docs,
    condition || {},
    modifier,
    { arrayFilters, cloneMode: options?.cloneMode ?? "copy" },
    options?.queryOptions
  );
  return res.modifiedFields ?? [];
}

/**
 * Updates all documents that match the specified filter for a collection.
 *
 * Supports both aggregation pipeline updates and standard update operators.
 * Documents in the collection may be replaced or modified.
 *
 * @param documents - The array of documents to update.
 * @param condition - The selection criteria for the update.
 * @param modifier - The modifications to apply.
 * @param updateConfig - Optional update config parameters.
 * @param options - Optional settings to control update behavior.
 */
export function updateMany<T extends AnyObject>(
  documents: T[],
  condition: Criteria<T>,
  modifier: Modifier<T> | PipelineStage[],
  updateConfig: UpdateConfig = {},
  options?: Partial<Options>
): { matchedCount: number; modifiedCount: number } {
  const { modifiedCount, matchedCount } = updateDocuments<T>(
    documents,
    condition,
    modifier,
    updateConfig,
    options
  );
  return { modifiedCount, matchedCount };
}

/**
 * Updates a single document within the collection based on the filter.
 *
 * Supports both aggregation pipeline updates and standard update operators.
 * Returns the number of documents matched and modified.
 * Objects in the array may be modified inplace or replaced entirely.
 *
 * @param documents - The array of documents to update.
 * @param condition - The selection criteria for the update.
 * @param modifier - The modifications to apply.
 * @param updateConfig - Optional update config parameters.
 * @param options - Optional settings to control update behavior.
 */
export function updateOne<T extends AnyObject>(
  documents: T[],
  condition: Criteria<T>,
  modifier: Modifier<T> | PipelineStage[],
  updateConfig: UpdateConfig = {},
  options?: Partial<Options>
) {
  return updateDocuments(documents, condition, modifier, updateConfig, {
    ...options,
    firstOnly: true
  });
}

/** Result of update operation */
export interface UpdateResult {
  /** Count of objects that matched filter. */
  readonly matchedCount: number;
  /** Count of objects modified. */
  readonly modifiedCount: number;
  /** Array of modified fields of single object. Available only for {@link updateOne}. */
  readonly modifiedFields?: string[];
  /** Index of the modified object within the collection. Available only for {@link updateOne}. */
  readonly modifiedIndex?: number;
}

function updateDocuments<T extends AnyObject>(
  documents: T[],
  condition: Criteria<T>,
  modifier: Modifier<T> | PipelineStage[],
  updateConfig: UpdateConfig = {},
  options?: Partial<Options> & { firstOnly?: boolean }
): UpdateResult {
  // apply options overrides
  options ||= {};

  const firstOnly = options?.firstOnly ?? false;
  const opts = ComputeOptions.init({
    ...options,
    collation: Object.assign({}, options?.collation, updateConfig?.collation)
  }).update({
    condition: condition,
    updateConfig: { cloneMode: "copy", ...updateConfig },
    variables: updateConfig.let,
    updateParams: {}
  });
  opts.context
    .addExpressionOps(booleanOperators)
    .addExpressionOps(comparisonOperators)
    .addQueryOps(queryOperators)
    .addPipelineOps(PIPELINE_OPERATORS);

  const filterExists = Object.keys(condition).length > 0;
  const matchedDocs = new Map<T, number>();
  let docsIter = Lazy(documents);

  if (filterExists) {
    const query = new Query<T>(condition, opts);
    // find matching documents
    docsIter = docsIter.filter<T>((o, i) => {
      if (query.test(o)) {
        matchedDocs.set(o, i);
        return true;
      }
      return false;
    });
  }

  // stores the index of the first document to be modified when using firstOnly is `true`.
  let modifiedIndex = -1;

  // apply first only and sort if specified
  if (firstOnly) {
    const indexes = new Map<T, number>();
    if (updateConfig.sort) {
      // sorting will mess up the index order which will require a scan to find the position to update.
      // apply minor optimization to get index of first document when no filter is specified.
      if (!filterExists) {
        docsIter = docsIter.map<T>((o, i) => {
          indexes.set(o, i);
          return o;
        });
      }
      docsIter = $sort(docsIter, updateConfig.sort, opts);
    }
    docsIter = docsIter.take(1);
    const firstDoc = docsIter.collect<T>()[0];
    modifiedIndex = matchedDocs.get(firstDoc) ?? indexes.get(firstDoc) ?? 0;
  }

  // docs to update
  const foundDocs = docsIter.collect<T>();
  if (foundDocs.length === 0) return { matchedCount: 0, modifiedCount: 0 };

  // USING AGGREGATION PIPELINE OPERATORS
  if (isArray(modifier)) {
    // indexes of documents to be updated. when indexes is empty, all documents are checked for update.
    const indexes = firstOnly
      ? [modifiedIndex]
      : Array.from(matchedDocs.values()); // empty when no filters applied

    // use hashing to detect changes.
    // if we have indexes, only track those documents in the index otherwise track all found documents.
    // this optimizes for the case where only a subset of documents are updated (e.g. firstOnly = true)
    const hashes = indexes.length
      ? indexes.map(i => hashCode(documents[i]))
      : foundDocs.map(o => hashCode(o));

    // the number of documents hashed equals the number of matched documents.
    const output = { matchedCount: hashes.length, modifiedCount: 0 };

    // store a copy of first only doc to track modified paths.
    const oldFirstDoc = firstOnly
      ? cloneDeep(documents[indexes[0]])
      : undefined;

    // apply pipeline stages
    let updateIter = Lazy(foundDocs);
    for (const stage of modifier) {
      const [op, expr] = Object.entries(stage)[0] as [StageName, Any];
      const pipelineOp = PIPELINE_OPERATORS[op] as Callback<Iterator>;
      assert(pipelineOp, `Unknown pipeline operator: '${op}'.`);
      updateIter = pipelineOp(updateIter, expr, opts);
    }

    const matches = updateIter.collect<T>();

    // update only modified indexes if documents were filtered
    if (indexes.length) {
      assert(
        indexes.length === matches.length,
        "bug: indexes and result size must match."
      );
      for (let i = 0; i < indexes.length; i++) {
        if (hashCode(matches[i]) !== hashes[i]) {
          documents[indexes[i]] = matches[i];
          output.modifiedCount++;
        }
      }
    } else {
      // update all documents where changes occurred
      for (let i = 0; i < documents.length; i++) {
        if (hashCode(matches[i]) !== hashes[i]) {
          documents[i] = matches[i];
          output.modifiedCount++;
        }
      }
    }

    // find all the modified fields if firstOnly.
    if (firstOnly && output.modifiedCount && oldFirstDoc) {
      const newDoc = documents[indexes[0]];
      const modifiedFields = getModifiedFields<T>(
        modifier,
        oldFirstDoc,
        newDoc
      );
      // modified fields MUST exist since we know the hashes did not match.
      assert(modifiedFields.length, "bug: failed to retrieve modified fields");
      Object.assign(output, { modifiedFields, modifiedIndex });
    }

    return output;
  }

  // USING UPDATE OPERATORS
  /*eslint import/namespace: ['error', { allowComputed: true }]*/

  // validated operators
  const unknownOp = Object.keys(modifier).find(op => !UPDATE_OPERATORS[op]);
  assert(!unknownOp, `Unknown update operator: '${unknownOp}'.`);

  const arrayFilters = updateConfig?.arrayFilters ?? [];

  const renameTargets = Object.values(modifier.$rename ?? {}).map(target => ({
    [target as string]: true
  }));

  const updateExpressions = [
    ...(Object.values(modifier) as AnyObject[]),
    ...renameTargets
  ];

  // build parameters and add to locals
  opts.update({
    updateParams: buildParams(updateExpressions, arrayFilters, opts)
  });

  const matchedCount = foundDocs.length;
  const output = { matchedCount, modifiedCount: 0 };
  const modifiedFields: string[] = [];

  const fns: Callback<string[]>[] = [];
  for (const op of Object.keys(modifier)) {
    const fn = UPDATE_OPERATORS[op] as Callback<(_: AnyObject) => string[]>;
    const expr = modifier[op as keyof typeof modifier] as Any;
    fns.push(fn(expr, arrayFilters, opts) as Callback<string[]>);
  }

  for (const doc of foundDocs) {
    let modified = false;
    for (const mutate of fns) {
      const fields = mutate(doc);
      if (fields.length) {
        modified = true;
        if (firstOnly) Array.prototype.push.apply(modifiedFields, fields);
      }
    }
    output.modifiedCount += +modified;
  }

  if (firstOnly && modifiedFields.length) {
    modifiedFields.sort();
    Object.assign(output, { modifiedFields, modifiedIndex });
  }

  return output;
}

/** Extracts fields added, changed, or deleted between the old and new document. */
function getModifiedFields<T extends AnyObject>(
  pipeline: PipelineStage[],
  oldDoc: T,
  newDoc: T
): string[] {
  const stageFields: string[] = [];
  for (const stage of pipeline) {
    const op = Object.keys(stage)[0];
    const expr = (stage as AnyObject)[op];
    switch (op) {
      case "$addFields":
      case "$set":
      case "$project":
      case "$replaceWith":
        stageFields.push(...Object.keys(expr as AnyObject));
        break;
      case "$unset":
        stageFields.push(...ensureArray(expr as string[]));
        break;
      case "$replaceRoot":
        stageFields.length = 0; // clear existing fields
        stageFields.push(
          ...Object.keys((expr as { newRoot: AnyObject })?.newRoot)
        );
        break;
    }
  }
  const stageFieldsSet = new Set(stageFields.sort());
  const pathValidator = new PathValidator();
  const modifiedFields: string[] = [];
  for (const key of stageFieldsSet) {
    if (
      pathValidator.add(key) &&
      !isEqual(resolve(newDoc, key), resolve(oldDoc, key))
    ) {
      modifiedFields.push(key);
    }
  }
  // for all top-level keys in oldDoc not in stage fields conflict, add to the updated fields.
  // this addresses cases where the entire object is replaced.
  for (const key of Object.keys(oldDoc)) {
    if (stageFieldsSet.has(key)) continue;
    if (!pathValidator.add(key) || !isEqual(newDoc[key], oldDoc[key])) {
      // (1) conflict detected because child keys already exists.
      //     since we don't know the state of sibling fields we must replace with top-level field instead.
      // (2) no conflict so we must check values and key only if not equal.
      modifiedFields.push(key);
    }
  }
  // sort the final list and pick only the parent key paths.
  const topLevelValidator = new PathValidator();
  return modifiedFields.sort().filter(key => topLevelValidator.add(key));
}
