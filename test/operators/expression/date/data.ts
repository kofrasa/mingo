export const testDate = new Date("2021-01-28T13:05:00Z");

// dates less 3 units
export const yearDate = new Date("2018-01-28T13:05:00Z");
export const quarterDate = new Date("2020-04-28T13:05:00Z");
export const monthDate = new Date("2020-10-28T13:05:00Z");
export const weekDate = new Date("2021-01-07T13:05:00Z");
export const dayDate = new Date("2021-01-25T13:05:00Z");
export const hourDate = new Date("2021-01-28T10:05:00Z");
export const minuteDate = new Date("2021-01-28T13:02:00Z");
export const secondDate = new Date("2021-01-28T13:04:57Z");
export const millisecondDate = new Date("2021-01-28T13:04:59.997Z");

export const apply3Units = Object.freeze({
  startDate: "$$this",
  amount: 3,
  timezone: "+00",
});

export const dateDiff3Units = Object.freeze({
  startDate: "$$this",
  endDate: testDate,
  timezone: "+00",
});
