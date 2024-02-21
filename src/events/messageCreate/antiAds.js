const { isStaff } = require('../../utils/isStaff');
const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const prisma = require('../../utils/prismaClient');
const { guilds, colors } = require('../../config');
const { getModChannels } = require('../../utils/getModChannels');
const log = require('../../utils/log');
const { Worker } = require('worker_threads');

/**
 * Checks if a message contains advertisements and takes appropriate actions.
 * @param {Message} message - The message object.
 */
async function antiAds(message) {
	log.debug('begin');
	if (!message.channel.guild) return;
	if (message.author.bot) return;

	if (!message.content.toLowerCase().includes('discord')) {
		return;
	}

	let sentAd = await checkAds(guilds, message.content, message.guild.id);

	if (!sentAd || typeof sentAd !== 'string') return;

	if (isStaff(message, message.member, PermissionFlagsBits.ManageMessages)) {
		return;
	}

	async function checkAds(guilds, content, guildID) {
		return new Promise((resolve, reject) => {
			const worker = new Worker(`${__dirname}/workerThreads/antiAdsWorker.js`);
			worker.postMessage({ guilds, content, guildID });
			worker.on('message', resolve);
			worker.on('error', reject);
			worker.on('exit', code => {
				if (code !== 0) reject(new Error(`Worker stopped with exit code ${code}`));
			});
		});
	}

	message.delete().catch(e => {
		log.error(`couldn't delete message: ${e}`);
	});

	message.author
		.send('You have been warned for sending a Discord invite link. Please do not send them before clearing it with staff. If you wish to partner with us, please DM the owners of the server')
		.catch(() => {});

	message.member.timeout(60_000 * 10, 'Invite Link Sent').catch(e => {
		log.error(`Couldn't time out member: ${e}`);
	});

	let logEmbed = new EmbedBuilder()
		.setColor(colors.main)
		.setTitle('Member Warned')
		.addFields(
			{ name: 'User', value: `<@${message.author.id}> (${message.author.id})` },
			{ name: 'Reason', value: 'Discord invite link sent' },
			{ name: 'Invite Link', value: sentAd },
			{ name: 'Moderator', value: `System` }
		)
		.setTimestamp();

	getModChannels(message.client, message.guild.id)
		.main.send({
			embeds: [logEmbed],
			content: `<@${message.author.id}> :: https://${sentAd}`,
		})
		.catch(e => {
			log.error(`Couldn't log warning: ${e}`);
		});

	prisma.warning
		.create({
			data: {
				userID: message.author.id,
				date: new Date(),
				guildId: message.guild.id,
				reason: 'Discord invite link sent',
				moderator: `System`,
				type: 'WARN',
			},
		})
		.catch(e => {
			log.error(`couldn't add warning to database: ${e}`);
		});
	log.debug('end');
}

module.exports = { antiAds };
