// all system operators
// helpers
import { OperatorType, useOperators } from "../core";
import * as accumulatorOperators from "../operators/accumulator";
import * as expressionOperators from "../operators/expression";
import * as pipelineOperators from "../operators/pipeline";
import * as projectionOperators from "../operators/projection";
import * as queryOperators from "../operators/query";

/**
 * Enable all supported MongoDB operators
 */
function enableSystemOperators() {
  useOperators(OperatorType.ACCUMULATOR, accumulatorOperators);
  useOperators(OperatorType.EXPRESSION, expressionOperators);
  useOperators(OperatorType.PIPELINE, pipelineOperators);
  useOperators(OperatorType.PROJECTION, projectionOperators);
  useOperators(OperatorType.QUERY, queryOperators);
}

enableSystemOperators();
