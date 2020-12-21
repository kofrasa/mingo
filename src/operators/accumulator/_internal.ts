/**
 * Compute the standard deviation of the data set
 * @param {Array} array of numbers
 * @param {Boolean} if true calculates a sample standard deviation, otherwise calculates a population stddev
 * @return {Number}
 */
export function stddev(data: number[], sampled: boolean): number {
  const sum = data.reduce((acc: number, n: number) => acc + n, 0);
  const N = data.length || 1;
  const correction = (sampled && 1) || 0;
  const avg = sum / N;
  return Math.sqrt(
    data.reduce((acc: number, n: number) => acc + Math.pow(n - avg, 2), 0) /
      (N - correction)
  );
}
