/**
 * Loads all Query and Projection operators
 */
// helpers
import { OperatorMap, OperatorType, useOperators } from "../core";
import * as booleanOperators from "../operators/expression/boolean";
import * as comparisonOperators from "../operators/expression/comparison";
import { $limit, $project, $skip, $sort } from "../operators/pipeline";
import * as projectionOperators from "../operators/projection";
import * as queryOperators from "../operators/query";
import { into, RawObject } from "../util";

/**
 * Enable basic operators. This includes only query and projection operators
 */
function enableBasicOperators() {
  useOperators(
    OperatorType.EXPRESSION,
    into({}, booleanOperators, comparisonOperators) as OperatorMap
  );
  useOperators(OperatorType.PIPELINE, { $project, $skip, $limit, $sort });
  useOperators(OperatorType.PROJECTION, projectionOperators);
  useOperators(OperatorType.QUERY, queryOperators);
}

enableBasicOperators();
