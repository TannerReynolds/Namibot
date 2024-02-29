const domain = "x";
const { domains } = require("../src/utils/blockedDomains.json");

function incl(domain) {
    const isBlocked = domains.includes(domain);
    return isBlocked;
}

function half(domain) {
    let lst = domains;
    runCheck();
    function runCheck() {
        let point = lst[lst.length / 2];
        if (domain !== point) {
            pointChar = point.split('')[0];
            domainChar = domain.split('')[0];
            halves = Math.ceil(lst.length / 2); 
            if (pointChar < domainChar) {
                lst = lst.slice(0, halves);
                runCheck();
            } else if (pointChar > domainChar) {
                lst = lst.slice(halves, lst.length);
                runCheck();
            }
        } else {
            return true;
        }
    }
}


console.log('init speed test')

console.time();
incl(domain)
console.timeEnd();

console.log('/////////////////////////////////////////')

console.time();
half(domain)
console.timeEnd();