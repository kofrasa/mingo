import { Lazy } from "../src/lazy";

const data = [1, 2, 3, 4, 5, 6, 7, 8, 9];

function isEven(n: number) {
  return n % 2 === 0;
}

describe("lazy", () => {
  it("can map", () => {
    const result = Lazy(data)
      .map((n) => (n as number) * 3)
      .value() as number[];
    expect(result).toStrictEqual([3, 6, 9, 12, 15, 18, 21, 24, 27]);
  });

  it("can filter", () => {
    const result = Lazy(data).filter(isEven).value() as number[];
    expect(result).toStrictEqual([2, 4, 6, 8]);
  });

  it("can skip with number", () => {
    const result = Lazy(data).drop(3).value() as number[];
    expect(result).toStrictEqual([4, 5, 6, 7, 8, 9]);
  });

  it("can take with number", () => {
    const result = Lazy(data).take(3).value() as number[];
    expect(result).toStrictEqual([1, 2, 3]);
  });

  // terminal method tests
  expect(
    Lazy(data).reduce<number>((acc, n) => (acc as number) + (n as number))
  ).toBe(45);

  it("can iterate with each", () => {
    const arr = [];
    Lazy(data).each((o) => arr.push((o as number) % 2));
    expect(arr).toStrictEqual([1, 0, 1, 0, 1, 0, 1, 0, 1]);
  });

  it("can count sequence", () => {
    expect(Lazy(data).size()).toBe(data.length);
  });
});
