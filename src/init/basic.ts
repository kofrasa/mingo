/**
 * Loads all Query and Projection operators
 */
import { Context, setGlobalContext } from "../core";
import * as booleanOperators from "../operators/expression/boolean";
import * as comparisonOperators from "../operators/expression/comparison";
import { $limit, $project, $skip, $sort } from "../operators/pipeline";
import * as projectionOperators from "../operators/projection";
import * as queryOperators from "../operators/query";

/** The basic context for queries. */
export const BASIC_CONTEXT = Context.init()
  .addExpressionOps({
    ...booleanOperators,
    ...comparisonOperators
  })
  .addPipelineOps({ $project, $skip, $limit, $sort })
  .addProjectionOps(projectionOperators)
  .addQueryOps(queryOperators);

// configure as global
setGlobalContext(BASIC_CONTEXT);
