const log = require('../../utils/log');

/**
 * Checks if a message contains potentially malicious file types in its content or attachments.
 * If a malicious file type is detected, it sends a warning message and deletes the original message.
 * @param {Message} message - The message to be checked.
 * @returns {Promise<void>} - A promise that resolves once the file type check is complete.
 */
async function fileTypeChecker(message) {
	log.debug('begin');
	if (!message.channel.guild) return log.debug('end');
	if (message.author.bot) return log.debug('end');

	try {
		let hasFile = false;

		let bannedFileTypes = [
			'.exe',
			'.js',
			'.bat',
			'.cmd',
			'.vbs',
			'.ps1',
			'.msi',
			'.dll',
			'.jar',
			'.reg',
			'.lnk',
			'.scr',
			'.pdf',
			'.doc',
			'.docx',
			'.xls',
			'.xlsx',
			'.ppt',
			'.pptx',
			'.zip',
			'.7z',
			'.rar',
			'.tar',
			'.gz',
			'.bz2',
			'.xz',
			'.lz',
			'.lzma',
			'.lz4',
			'.z',
			'.zipx',
			'.iso',
		];

		let urls = (await detectURL(message.content)) || false;

		if (urls && urls.length > 0) {
			urls.some(u => {
				let paramRemoval = u.split('?')[0].split('#')[0];
				let extension = `.${paramRemoval.split('.').pop().toLowerCase()}`;

				if (bannedFileTypes.some(type => extension.endsWith(type))) {
					hasFile = true;
					return true;
				}
				return false;
			});
		}

		if (message.attachments.size > 0) {
			hasFile = message.attachments.some(a => a.name && bannedFileTypes.some(type => a.name.includes(`.${type}`)));
		}

		if (hasFile) {
			message.reply('Potentially malicious file type detected.').then(r => {
				message.delete();
				setTimeout(() => {
					r.delete();
				}, 4000);
			});
		} else {
			return log.debug('end');
		}

		log.debug('end');
	} catch (e) {
		log.error(`Error in fileTypeChecker: ${e}`);
	}
	/**
	 * Detects URLs in a string.
	 * @param {string} string - The string to be checked for URLs.
	 * @returns {string[]} - An array of URLs found in the string.
	 */
	async function detectURL(string) {
		const urlReg = /https?:\/\/(www\.)?[a-zA-Z0-9\-.]+[a-zA-Z0-9\-._~:/?#[\]@!$&'()*+,;=]*/g;
		return string.match(urlReg);
	}
}

module.exports = { fileTypeChecker };
