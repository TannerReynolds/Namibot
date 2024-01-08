const { DateTime, Duration } = require("luxon");

async function parseNewDate(duration) {
  const regexes = {
    years: /(\d+y)/,
    months: /(\d+mo)/,
    weeks: /(\d+w)/,
    days: /(\d+d)/,
    hours: /(\d+h)/,
    minutes: /(\d+mi)/,
    seconds: /(\d+s)/,
  };

  const parsedValues = {};

  for (const key in regexes) {
    const match = duration.match(regexes[key]);
    if (match) {
      parsedValues[key] = parseInt(match[0]);
    }
  }

  let parsedDuration = Duration.fromObject(parsedValues);
  let now = DateTime.local();
  let nwd = now.plus(parsedDuration).toJSDate();

  return nwd;
}
async function durationToString(duration) {
  const regexes = {
    years: /(\d+y)/,
    months: /(\d+mo)/,
    weeks: /(\d+w)/,
    days: /(\d+d)/,
    hours: /(\d+h)/,
    minutes: /(\d+mi)/,
    seconds: /(\d+s)/,
  };

  const durationNames = {
    years: ["year", "years"],
    months: ["month", "months"],
    weeks: ["week", "weeks"],
    days: ["day", "days"],
    hours: ["hour", "hours"],
    minutes: ["minute", "minutes"],
    seconds: ["second", "seconds"],
  };

  const parsedValues = [];

  for (const key in regexes) {
    const match = duration.match(regexes[key]);
    if (match) {
      const value = parseInt(match[0]);
      const word = value === 1 ? durationNames[key][0] : durationNames[key][1];
      parsedValues.push(`${value} ${word}`);
    }
  }

  return parsedValues.join(", ").replace(/,([^,]*)$/, ", and$1");
}

module.exports = { parseNewDate, durationToString };
