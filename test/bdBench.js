//const domain = "zigzag.vn";
const domain = "yespleaselmao";
const { domains } = require("../src/utils/blockedDomains2.json");

function incl(domain) {
  const isBlocked = domains.includes(domain);
  return isBlocked;
}

function half(domain) {
  let lst = domains;
  return runCheck();

  function runCheck() {
    if (lst.length === 0) return false;
    let point = lst[Math.floor(lst.length / 2)];
    if (domain !== point) {
      let pos = 0;
      let pointChar = point.split("")[pos];
      let domainChar = domain.split("")[pos];
      if (pointChar === domainChar) {
        iterateChars();
      }
      function iterateChars() {
        pos++;
        pointChar = point.split("")[pos];
        domainChar = domain.split("")[pos];
        if (pointChar === domainChar) {
          iterateChars();
        }
      }
      let halves = Math.ceil(lst.length / 2);
      if (pointChar < domainChar) {
        lst = lst.slice(halves);
        return runCheck();
      } else if (pointChar > domainChar) {
        lst = lst.slice(0, halves);
        return runCheck();
      }
    } else {
      return true;
    }
  }
}

function search(domain) {
  let left = 0;
  let right = domains.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const comparison = domains[mid].localeCompare(domain);

    if (comparison === 0) {
      return true;
    } else if (comparison < 0) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  return false;
}

console.log("Algorithm Speed Test");

console.log("JavaScript Built in .includes method");
console.time();
incl(domain);
console.log(incl(domain));
console.timeEnd();
console.log("\n");

console.log("ChatGPT's Search Algorithm");
console.time();
search(domain);
console.log(search(domain));
console.timeEnd();
console.log("\n");

console.log("My Binary Search Algorithm");
console.time();
half(domain);
console.log(half(domain));
console.timeEnd();
console.log("\n");
