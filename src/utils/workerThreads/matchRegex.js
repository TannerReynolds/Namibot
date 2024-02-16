const { parentPort, workerData } = require('worker_threads');

const { regex, message } = workerData;

// Directly create a RegExp object from the string. Flags can be included in the string.
const regExp = new RegExp(regex);

// Perform the match operation and send the result back
const matchResult = message.match(regExp);
parentPort.postMessage(matchResult);
