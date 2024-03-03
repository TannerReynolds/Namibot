const { DateTime, Duration } = require("luxon");
const { toENTime } = require("./toEN");
const { regexMatch } = require("./regex");
//const log = require('./log');

const regexes = {
  years: "(d+y)",
  months: "(d+mo)",
  weeks: "(d+w)",
  days: "(d+d)",
  hours: "(d+h)",
  minutes: "(d+mi)",
  seconds: "(d+s)",
};
const flag = "i";

/**
 * Parses a duration string and returns a new date.
 *
 * @param {string} duration - The duration string to parse.
 * @returns {Date} The parsed date.
 */
async function parseNewDate(duration) {
  if (isJP(duration)) duration = await toENTime(duration);

  duration = await mToMi(duration);
  const parsedValues = {};

  for (const key in regexes) {
    const match = await matchRegex(duration, regexes[key], flag);
    if (match) {
      parsedValues[key] = parseInt(match[0]);
    }
  }

  let parsedDuration = Duration.fromObject(parsedValues);
  let now = DateTime.local();
  let nowJS = new Date();
  let nwd = now.plus(parsedDuration).toJSDate();

  if (!nwd) return new Date(2100, 0, 1);

  if (nowJS.setFullYear(nowJS.getFullYear() + 10) < nwd) {
    return new Date(2100, 0, 1);
  }

  return nwd;
}

/**
 * Converts a raw duration string to a human-readable format.
 * @param {string} rawDuration - The raw duration string to be parsed.
 * @returns {string} - The parsed duration string in a human-readable format.
 */
async function durationToString(rawDuration) {
  let duration = rawDuration;
  if (isJP(rawDuration)) duration = await toENTime(rawDuration);
  duration = await mToMi(duration);
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
    const match = await matchRegex(duration, regexes[key], flag);
    if (match) {
      const value = parseInt(match[0]);
      const word = value === 1 ? durationNames[key][0] : durationNames[key][1];
      parsedValues.push(`${value} ${word}`);
    }
  }

  if (isJP(rawDuration)) {
    return `${rawDuration} (${parsedValues.join(", ").replace(/,([^,]*)$/, ", and$1")})`;
  }

  return parsedValues.join(", ").replace(/,([^,]*)$/, ", and$1");
}

/**
 * Checks if a duration string is valid.
 * @param {string} duration - The duration string to validate.
 * @returns {boolean} - Returns true if the duration is valid, false otherwise.
 */
async function isValidDuration(duration) {
  if (isJP(duration)) duration = await toENTime(duration);
  duration = await mToMi(duration);
  for (const key in regexes) {
    const match = await matchRegex(duration, regexes[key], flag);
    if (match) {
      return true;
    }
  }

  return false;
}

/**
 * Converts a duration string to seconds.
 * If the duration string is in Japanese, it will be converted to English time format before parsing.
 * @param {string} durationStr - The duration string to be parsed.
 * @returns {number} - The duration in seconds.
 */
async function durationToSec(durationStr) {
  if (isJP(durationStr)) durationStr = await toENTime(durationStr);
  const parsedValues = {};

  for (const key in regexes) {
    const match = await matchRegex(durationStr, regexes[key], flag);
    if (match) {
      parsedValues[key] = parseInt(match[1]);
    }
  }

  let parsedDuration = Duration.fromObject(parsedValues);
  return parsedDuration.as("seconds");
}

/**
 * Replaces 'm' with 'mi' in the given text.
 * @param {string} text - The input text.
 * @returns {string} The modified text with 'm' replaced by 'mi'.
 */
async function mToMi(text) {
  const minute = /(\d)m(?![imo])/g;
  return text.replace(minute, "$1mi");
}

const isJP = (str) => /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(str);

module.exports = {
  parseNewDate,
  durationToString,
  isValidDuration,
  durationToSec,
};
