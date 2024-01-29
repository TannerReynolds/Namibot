const { getLogPassword } = require('../utils/sharedState');
const fs = require('fs').promises;
const log = require('../utils/log');
const path = require('path');

async function auth(req, res) {
	log.verbose(JSON.stringify(req.body));
	const { password, redirect } = req.body;

	let isAuthenticated = false;

	if (password === getLogPassword()) {
		isAuthenticated = true;
	}
	if (isAuthenticated) {
		const filePath = path.resolve(`./server/public${redirect}.html`);
		log.verbose(`Sending file ${filePath}`);
		let html = await fs.readFile(filePath, { encoding: 'utf-8' });
		res.status(200);
		res.send(html);
	} else {
		log.verbose(`Unauthorized`);
		res.status(401).json({ message: 'Unauthorized' });
	}
}

module.exports = { auth };
