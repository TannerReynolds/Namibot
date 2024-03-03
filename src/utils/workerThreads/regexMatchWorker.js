module.exports = ({ string, regex, flag }) => {
  try {
    const regExp = new RegExp(regex, flag);
    const matchResult = string.match(regExp);
    return matchResult;
  } catch (error) {
    throw new Error(error.message);
  }
};