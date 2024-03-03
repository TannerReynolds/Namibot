const path = require("path");
const Piscina = require("piscina");
const { cpuThreads } = require("../config");

const workerPath = path.resolve(__dirname, "./workerThreads/regexMatchWorker.js");
const piscina = new Piscina({
  filename: workerPath,
  maxThreads: cpuThreads,
});

async function regexMatch(string, regex, flag) {
  try {
    const matchResult = await piscina.run({ string, regex, flag });
    return matchResult;
  } catch (error) {
    console.error("Error in regexMatch:", error);
    throw error;
  }
}

module.exports = { regexMatch };