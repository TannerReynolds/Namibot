/**
 * Converts a Japanese time expression to an English time expression.
 * @param {string} japaneseNumber - The Japanese time expression to be converted.
 * @returns {string} - The converted English time expression.
 */
async function toENTime(japaneseNumber) {
  const kanjiNumbers = {
    一: 1,
    二: 2,
    三: 3,
    四: 4,
    五: 5,
    六: 6,
    七: 7,
    八: 8,
    九: 9,
    〇: 0,
  };

  const multipliers = {
    十: 10,
    百: 100,
    千: 1000,
    万: 10000,
  };

  const units = {
    秒: "s",
    分: "mi",
    時間: "h",
    日: "d",
    週間: "w",
    月: "mo",
    年: "y",
  };

  let result = "";
  let numberPart = 0;
  let currentMultiplier = 1;
  let lastWasMultiplier = false;
  let unitBuffer = "";

  /**
   * Processes the number part and appends it to the result.
   * @param {string} unit - The unit of time.
   */
  const processNumberPart = (unit) => {
    if (lastWasMultiplier && numberPart === 0) {
      numberPart = 1;
    }
    result += numberPart + unit;
    numberPart = 0;
  };

  for (let i = 0; i < japaneseNumber.length; i++) {
    const char = japaneseNumber[i];
    unitBuffer += char;
    if (char in multipliers) {
      if (numberPart === 0) numberPart = 1;
      currentMultiplier = multipliers[char];
      numberPart *= currentMultiplier;
      lastWasMultiplier = true;
      unitBuffer = "";
    } else if (char in kanjiNumbers) {
      if (lastWasMultiplier) {
        numberPart += kanjiNumbers[char];
      } else {
        numberPart = kanjiNumbers[char];
      }
      lastWasMultiplier = false;
      unitBuffer = "";
    } else if (unitBuffer in units) {
      processNumberPart(units[unitBuffer]);
      lastWasMultiplier = false;
      unitBuffer = "";
    } else if (!(char in units)) {
      if (
        i === japaneseNumber.length - 1 ||
        !(japaneseNumber.substring(i, i + 2) in units)
      ) {
        return "forever";
      }
    } else {
      return "forever";
    }
  }

  if (numberPart > 0) {
    result += numberPart;
  }

  /**
   * Checks if there are still Japanese characters in the result.
   * @param {string} str - The string to be checked.
   * @returns {boolean} - True if there are still Japanese characters, false otherwise.
   */
  let isStillJP = (str) =>
    /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(str);
  if (isStillJP(result)) {
    result = "forever";
  }

  return result;
}

module.exports = { toENTime };
