import { $addFields } from './addFields'
import { $bucket } from './bucket'
import { $bucketAuto } from './bucketAuto'
import { $count } from './count'
import { $facet } from './facet'
import { $group } from './group'
import { $limit } from './limit'
import { $lookup } from './lookup'
import { $match } from './match'
import { $out } from './out'
import { $project } from './project'
import { $redact } from './redact'
import { $replaceRoot } from './replaceRoot'
import { $sample } from './sample'
import { $set } from './addFields'
import { $skip } from './skip'
import { $sort } from './sort'
import { $sortByCount } from './sortByCount'
import { $unwind } from './unwind'

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
  $set,
  $skip,
  $sort,
  $sortByCount,
  $unwind
}

