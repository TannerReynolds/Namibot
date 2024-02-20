const axios = require('axios');

/**
 * Unshortens a URL by following redirects and returns the list of expanded URLs.
 * @param {string} originalUrl - The original URL to unshorten.
 * @returns {Promise<string[]>} - A promise that resolves to an array of expanded URLs.
 */
async function unshortenURL(originalUrl) {
	let urls = [];
	let seenUrls = new Set();
	const maxUrlCount = 20;

	/**
	 * Fetches the URL and follows redirects recursively.
	 * @param {string} url - The URL to fetch.
	 */
	async function fetchUrl(url) {
		if (seenUrls.size >= maxUrlCount) {
			urls.push('and more');
			return;
		}
		if (seenUrls.has(url)) {
			throw new Error('Detected a URL loop');
		}
		seenUrls.add(url);

		try {
			const response = await axios.get(url, {
				maxRedirects: 0,
				validateStatus: null,
				timeout: 5000,
			});

			const metaRefresh = /<meta http-equiv="refresh" content="\d+;\s*url=(.*?)"/i;
			const metaMatch = response.data.match(metaRefresh);
			if (metaMatch && metaMatch[1]) {
				const metaUrl = metaMatch[1].replace(/['"]+/g, '');
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
			if (error.response && error.response.status !== 404) {
				const location = error.response.headers.location;
				if (location) {
					urls.push(location);
					await fetchUrl(location);
				}
			} else {
				console.error('Error fetching URL:', error.message);
			}
		}
	}

	await fetchUrl(originalUrl);

	return urls;
}

module.exports = {
	unshortenURL,
};
