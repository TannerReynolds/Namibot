const axios = require("axios");

module.exports = async (originalUrl) => {
  try {
    let urls = await unshortenURL(originalUrl);
    return urls;
  } catch (error) {
    throw new Error(error.message);
  }
};

async function unshortenURL(originalUrl) {
  let urls = [];
  let seenUrls = new Set();
  const maxUrlCount = 20;

  async function fetchUrl(url) {
    if (seenUrls.size >= maxUrlCount) {
      urls.push("and more");
      return;
    }
    if (seenUrls.has(url)) {
      throw new Error("Detected a URL loop");
    }
    seenUrls.add(url);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await axios.get(url, {
        signal: controller.signal,
        maxRedirects: 0,
        validateStatus: null,
        timeout: 5000,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        },
      });

      clearTimeout(timeoutId);

      const metaRefresh =
        /<meta http-equiv="refresh" content="\d+;\s*url=(.*?)"/i;
      const metaMatch = response.data.match(metaRefresh);
      if (metaMatch && metaMatch[1]) {
        const metaUrl = metaMatch[1].replace(/['"]+/g, "");
        urls.push(metaUrl);
        await fetchUrl(metaUrl);
        return;
      }

      if ([301, 302, 307, 308].includes(response.status)) {
        const location = response.headers.location;
        if (location) {
          urls.push(location);
          await fetchUrl(location);
          return;
        }
      }
    } catch (error) {
      clearTimeout(timeoutId);

      if (error.name === "AbortError") {
        console.error("Request timed out for URL:", url);
      } else if (error.response && error.response.status !== 404) {
        const location = error.response.headers.location;
        if (location) {
          urls.push(location);
          await fetchUrl(location);
        } else {
          console.error("Error fetching URL:", error.message);
        }
      } else {
        urls.push(url);
        console.error("Error fetching URL:", error.message);
      }
    }
  }

  await fetchUrl(originalUrl);
  return urls;
}
