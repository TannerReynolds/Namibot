const { parentPort } = require("worker_threads");

parentPort.on("message", ({ string, regex, flag }) => {
  try {
    const regExp = new RegExp(regex, flag);
    const matchResult = string.match(regExp);
    parentPort.postMessage(matchResult);
  } catch (error) {
    parentPort.postMessage({ error: error.message });
  }
});
