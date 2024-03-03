const { workerData, parentPort } = require("worker_threads");

parentPort.on("message", ({ string, regex, flag }) => {
  try {
    // Include flags directly in the RegExp constructor
    const regExp = new RegExp(regex, flag);
    const matchResult = string.match(regExp);
    parentPort.postMessage(matchResult);
  } catch (error) {
    // Handle potential errors, such as invalid regex patterns
    parentPort.postMessage({ error: error.message });
  }
});
