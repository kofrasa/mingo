// load all operators
import { OperatorType, useOperators } from "../core";
import * as accumulatorOperators from "../operators/accumulator";
import * as expressionOperators from "../operators/expression";
import * as pipelineOperators from "../operators/pipeline";
import * as projectionOperators from "../operators/projection";
import * as queryOperators from "../operators/query";
import * as windowOperators from "../operators/window";

useOperators(OperatorType.ACCUMULATOR, accumulatorOperators);
useOperators(OperatorType.EXPRESSION, expressionOperators);
useOperators(OperatorType.PIPELINE, pipelineOperators);
useOperators(OperatorType.PROJECTION, projectionOperators);
useOperators(OperatorType.QUERY, queryOperators);
useOperators(OperatorType.WINDOW, windowOperators);
