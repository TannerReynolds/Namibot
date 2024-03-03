const { Worker } = require("worker_threads");
const path = require("path");

async function regexMatch(string, regex, flag) {
  return await matchWorker(string, regex, flag);
}

function matchWorker(string, regex, flag) {
  return new Promise((resolve, reject) => {
    const workerPath = path.resolve(
      __dirname,
      "./workerThreads/regexMatchWorker.js",
    );
    const worker = new Worker(workerPath);

    worker.postMessage({ string, regex, flag });
    worker.on("message", resolve);
    worker.on("error", reject);
    worker.on("exit", (code) => {
      if (code !== 0) {
        reject(new Error(`Worker stopped with exit code ${code}`));
      }
    });
  });
}

module.exports = { regexMatch };
