let c = require("../config.json");
const ejs = require("ejs");
const util = require("util");
const renderFile = util.promisify(ejs.renderFile);

async function auth(req, res, correctPass) {
  const { password } = req.body;

  let isAuthenticated = true;

  if (password === correctPass) {
    isAuthenticated = true;
  }
  if (isAuthenticated) {
    console.log("Sending confEditor");
    try {
      const html = await renderFile(`${__dirname}/views/confEditor.ejs`, {
        config: c,
      });
      console.log(html);
      res.status(200);
      res.send(html);
    } catch (error) {
      console.error("Error rendering EJS template:", error);
    }
  } else {
    res.status(401).json({ message: "Unauthorized" });
  }
}

module.exports = { auth };
