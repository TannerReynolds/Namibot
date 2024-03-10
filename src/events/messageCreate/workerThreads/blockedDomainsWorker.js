const { domains } = require("../../../utils/blockedDomainsSorted.json");

module.exports = (domain) => {
  const isBlocked = search(domain);
  function search(domain) {
    let lst = domains;
    return runCheck();

    function runCheck() {
      if (lst.length === 0) return false;
      if (lst.length === 1 && domain !== lst[0]) return false;
      let point = lst[Math.floor(lst.length / 2)];

      if (domain === point) {
        return true;
      }

      let pos = 0;
      let pointChar = point.split("")[pos];

      if (typeof domain !== "string") return false;
      let domainChar = domain.split("")[pos];

      while (
        pointChar === domainChar &&
        pos < domain.length &&
        pos < point.length
      ) {
        pos++;
        pointChar = point.split("")[pos];
        domainChar = domain.split("")[pos];
      }

      let halves = Math.ceil(lst.length / 2);
      if (
        domainChar < pointChar ||
        pos >= domain.length ||
        pos >= point.length
      ) {
        lst = lst.slice(0, halves);
      } else {
        lst = lst.slice(halves);
      }

      return runCheck();
    }
  }
  return isBlocked;
};
