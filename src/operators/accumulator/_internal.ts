/**
 * Compute the standard deviation of the data set
 * @param {Array} array of numbers
 * @param {Boolean} if true calculates a sample standard deviation, otherwise calculates a population stddev
 * @return {Number}
 */
export function stddev(data: number[], sampled = true): number {
  const sum = data.reduce((acc: number, n: number) => acc + n, 0);
  const N = data.length || 1;
  const avg = sum / N;
  return Math.sqrt(
    data.reduce((acc: number, n: number) => acc + Math.pow(n - avg, 2), 0) /
      (N - Number(sampled))
  );
}

export function covariance(dataset: number[][], sampled = true): number {
  if (!dataset) return null;
  if (dataset.length < 2) return sampled ? null : 0;

  let meanX = 0.0;
  let meanY = 0.0;
  for (const [x, y] of dataset) {
    meanX += x;
    meanY += y;
  }
  meanX /= dataset.length;
  meanY /= dataset.length;

  let result = 0;
  for (const [x, y] of dataset) {
    result += (x - meanX) * (y - meanY);
  }

  return result / (dataset.length - Number(sampled));
}
