const path = require("path");
const Piscina = require("piscina");
const { cpuThreads } = require("../config");

const workerPath = path.resolve(
  __dirname,
  "./workerThreads/urlUnshortenWorker.js",
);
const piscina = new Piscina({
  filename: workerPath,
  maxThreads: cpuThreads,
});

async function unshortenURL(originalUrl) {
  try {
    const matchResult = await piscina.run(originalUrl);
    return matchResult;
  } catch (error) {
    console.error("Error in regexMatch:", error);
    throw error;
  }
}

module.exports = {
  unshortenURL,
};
