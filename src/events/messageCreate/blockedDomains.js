/* eslint-disable no-useless-escape */
const { Worker } = require("worker_threads");
const log = require("../../utils/log");
const { regexMatch } = require("../../utils/regex");

async function blockedDomains(message) {
  if (!message.guild || message.author.bot) return;

  let urls = await detectURL(message.content);
  if (!urls || urls.length === 0) return;

  for (let url of urls) {
    let domainMatch = await extractDomain(url);
    if (domainMatch && domainMatch.length > 0) {
      let domain = domainMatch[0];
      const isBlocked = await checkDomainWithWorker(domain);
      if (isBlocked) {
        // yea
        log.debug("Blocked domain detected:", domain);
        break;
      }
    }
  }
}

async function checkDomainWithWorker(domain) {
  return new Promise((resolve, reject) => {
    const worker = new Worker("./workerThreads/blockedDomainsWorker.js");
    worker.postMessage(domain);
    worker.on("message", resolve);
    worker.on("error", reject);
    worker.on("exit", (code) => {
      if (code !== 0)
        reject(new Error(`Worker stopped with exit code ${code}`));
    });
  });
}

async function detectURL(string) {
  const urlReg =
    "https?:\\/\\/(www\\.)?[a-zA-Z0-9\\-.]+[a-zA-Z0-9\\-._~:\\/?#[\\]@!$&'()*+,;=]*";
  const urlFlag = "g";

  try {
    const matches = await regexMatch(string, urlReg, urlFlag);
    return matches;
  } catch (e) {
    return null;
  }
}

async function extractDomain(url) {
  const domainReg = "(?:https?://)?(?:www.)?([a-zA-Z0-9-.]+)(?:[/]|$)";
  try {
    const matches = await regexMatch(url, domainReg, "g");
    return matches;
  } catch (e) {
    return null;
  }
}

module.exports = { blockedDomains };
