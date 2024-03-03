const fs = require("fs");
const path = "../src/utils/blockedDomains.json";

fs.readFile(path, "utf8", (err, data) => {
  if (err) {
    console.error("Error reading the file:", err);
    return;
  }

  const obj = JSON.parse(data);

  obj.domains.sort();

  fs.writeFile(`${path}2.json`, JSON.stringify(obj, null, 2), "utf8", (err) => {
    if (err) {
      console.error("Error writing the file:", err);
    } else {
      console.log("File successfully written with the sorted array.");
    }
  });
});
