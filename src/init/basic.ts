/**
 * Loads all Query and Projection operators
 */
import { OperatorType, useOperators } from "../core";
import * as booleanOperators from "../operators/expression/boolean";
import * as comparisonOperators from "../operators/expression/comparison";
import { $limit, $project, $skip, $sort } from "../operators/pipeline";
import * as projectionOperators from "../operators/projection";
import * as queryOperators from "../operators/query";

useOperators(OperatorType.EXPRESSION, {
  ...booleanOperators,
  ...comparisonOperators,
});
useOperators(OperatorType.PIPELINE, { $project, $skip, $limit, $sort });
useOperators(OperatorType.PROJECTION, projectionOperators);
useOperators(OperatorType.QUERY, queryOperators);
