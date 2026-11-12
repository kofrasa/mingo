import { ComputeOptions, evalExpr } from "../../core/_internal";
import { Any, Options } from "../../types";

/**
 * Evaluates an argument such as `n` of the N accumulators ($firstN, $topN, ...).
 * Inside $group, MongoDB resolves field paths in it against the group key (`_id`),
 * not against the documents of the group.
 */
export function evalGroupArg(expr: Any, options: Options): Any {
  const copts = options as ComputeOptions;
  const groupId = copts?.local?.groupId as Any;
  if (groupId === undefined) return evalExpr(groupId, expr, copts);
  return evalExpr(
    groupId,
    expr,
    ComputeOptions.init(copts).update({ root: groupId })
  );
}

export function stddev(data: number[], sampled = true) {
  let sum = 0;
  for (let i = 0; i < data.length; i++) sum += data[i];

  const mean = sum / data.length;

  let result = 0;
  for (let i = 0; i < data.length; i++) {
    const x = data[i] - mean;
    result += x * x;
  }

  return Math.sqrt(result / (data.length - Number(sampled)));
}

export function covariance(dataset: number[][], sampled = true) {
  if (dataset.length < 2) return sampled ? null : 0;

  let meanX = 0.0;
  let meanY = 0.0;
  for (let i = 0; i < dataset.length; i++) {
    const [x, y] = dataset[i];
    meanX += x;
    meanY += y;
  }
  meanX /= dataset.length;
  meanY /= dataset.length;

  let result = 0;
  for (let i = 0; i < dataset.length; i++) {
    const [x, y] = dataset[i];
    result += (x - meanX) * (y - meanY);
  }

  return result / (dataset.length - Number(sampled));
}
