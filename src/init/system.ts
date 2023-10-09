// load all operators
import { Context, setGlobalContext } from "../core";
import * as accumulatorOperators from "../operators/accumulator";
import * as expressionOperators from "../operators/expression";
import * as pipelineOperators from "../operators/pipeline";
import * as projectionOperators from "../operators/projection";
import * as queryOperators from "../operators/query";
import * as windowOperators from "../operators/window";

setGlobalContext(
  Context.init()
    .addAccumulatorOps(accumulatorOperators)
    .addExpressionOps(expressionOperators)
    .addPipelineOps(pipelineOperators)
    .addProjectionOps(projectionOperators)
    .addQueryOps(queryOperators)
    .addWindowOps(windowOperators)
);
