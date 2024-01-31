const { parentPort } = require('worker_threads');
const { domains } = require('../../../utils/blockedDomains.json');

parentPort.on('message', (domain) => {
    const isBlocked = domains.includes(domain);
    parentPort.postMessage(isBlocked);
});