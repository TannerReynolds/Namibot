const log = require('../../utils/log');

/**
 * Checks if a message contains potentially malicious file types in its content or attachments.
 * If a malicious file type is detected, it sends a warning message and deletes the original message.
 * @param {Message} message - The message to be checked.
 * @returns {Promise<void>} - A promise that resolves once the file type check is complete.
 */
async function fileTypeChecker(message) {
	if (!message.channel.guild) return;
	if (message.author.bot) return;
	log.debug('Starting file type detection');
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

	log.debug(`Checking message content for malicious files... "${message.content}"`);
	let urls = (await detectURL(message.content)) || false;

	if (urls && urls.length > 0) {
		log.debug(`found URL`);

		urls.some(u => {
			let paramRemoval = u.split('?')[0].split('#')[0];
			let extension = `.${paramRemoval.split('.').pop().toLowerCase()}`;

			if (bannedFileTypes.some(type => extension.endsWith(type))) {
				log.debug(`url has malicious file type`);
				hasFile = true;
				return true;
			}
			return false;
		});
	}

	if (message.attachments.size > 0) {
		log.debug(`Looking in message attachments`);
		hasFile = message.attachments.some(a => a.name && bannedFileTypes.some(type => a.name.includes(`.${type}`)));
	}

	if (hasFile) {
		log.debug(`sending file detected message`);
		message.reply('Potentially malicious file type detected.').then(r => {
			log.debug(`deleting message`);
			message.delete();
			setTimeout(() => {
				log.debug(`deleting response`);
				r.delete();
			}, 4000);
		});
	} else {
		return log.debug('No malicious filetype detected');
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
