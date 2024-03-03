const { parentPort } = require("worker_threads");
const { domains } = require("../../../utils/blockedDomainsSorted.json");

parentPort.on("message", (domain) => {
  const isBlocked = search(domain);
  function search(domain) {
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
  parentPort.postMessage(isBlocked);
});
