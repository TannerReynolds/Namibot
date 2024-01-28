const ejs = require('ejs');
const fs = require('fs-extra');
const { getModChannels } = require('../../utils/getModChannels');
const { EmbedBuilder, MessageAttachment } = require('discord.js');
const { colors, server } = require('../../config.json');

async function bulkDeleteLog(messages, channel, client) {
	let fileName = `bdl${randomToken(8)}`;
	const stream = fs.createWriteStream(`./server/public/${fileName}.html`);
	stream.once('open', () => {
		ejs.renderFile(
			`./server/views/bulkDelete.ejs`,
			{
				messages: messages,
				client: client,
			},
			{},
			(_renderErr, str) => {
				stream.write(str);
			}
		);
		stream.end();
		let deleteEmbed = false;
		if (server.enabled) {
			deleteEmbed = new EmbedBuilder()
				.setTitle(`Bulk Messages Deleted`)
				.setColor(colors.main)
				.addFields({ name: 'Deleted Messages', value: `${server.url}/${fileName}` })
				.setTimestamp();
			getModChannels(client, channel.guild.id).secondary.send({
				embeds: [deleteEmbed],
			});
		} else {
			let attach = new MessageAttachment(`./server/public/${fileName}.html`);
			deleteEmbed = new EmbedBuilder().setTitle(`Bulk Messages Deleted`).setColor(colors.main).setTimestamp();
			getModChannels(client, channel.guild.id)
				.secondary.send({
					embeds: [deleteEmbed],
					files: [attach],
				})
				.then(r => {
					fs.unlink(`./server/public/${fileName}.html`, err => {
						if (err) throw err;
					});
				});
		}
	});
}

module.exports = { bulkDeleteLog };

function randomToken(number, symbols) {
	number = parseInt(number, 10);
	let text = '';
	let possible;
	if (symbols !== true) {
		possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	} else {
		possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789`~!@#$%^&*()-_=+[]{}|;:/?><,.';
	}
	for (let i = 0; i < number; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}
