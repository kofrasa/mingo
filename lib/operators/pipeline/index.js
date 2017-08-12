import { $addFields } from './addFields.js'
import { $bucket } from './bucket.js'
import { $bucketAuto } from './bucketAuto.js'
import { $count } from './count.js'
import { $facet } from './facet.js'
import { $group } from './group.js'
import { $limit } from './limit.js'
import { $lookup } from './lookup.js'
import { $match } from './match.js'
import { $out } from './out.js'
import { $project } from './project.js'
import { $redact } from './redact.js'
import { $replaceRoot } from './replaceRoot.js'
import { $sample } from './sample.js'
import { $skip } from './skip.js'
import { $sort } from './sort.js'
import { $sortByCount } from './sortByCount.js'
import { $unwind } from './unwind.js'

/**
 * Pipeline Aggregation Stages. https://docs.mongodb.com/manual/reference/operator/aggregation-
 */
export const pipelineOperators = {
  $addFields,
  $bucket,
  $bucketAuto,
  $count,
  $facet,
  $group,
  $limit,
  $lookup,
  $match,
  $out,
  $project,
  $redact,
  $replaceRoot,
  $sample,
  $skip,
  $sort,
  $sortByCount,
  $unwind
}

