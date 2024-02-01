const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { isStaff, hasHigherPerms } = require('../utils/isStaff');
const prisma = require('../utils/prismaClient');
const { defineTarget } = require('../utils/defineTarget');
const { defineDuration, defineDurationString } = require('../utils/defineDuration');
const { getModChannels } = require('../utils/getModChannels');
const { colors } = require('../config.json');
const c = require('../config.json');
const log = require('../utils/log');
const { sendReply } = require('../utils/sendReply');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ban')
		.setDescription('Ban a user from the server using either a mention or an id')
		.setDMPermission(false)
		.addStringOption(option => option.setName('user').setDescription('The user to ban.').setRequired(true))
		.addStringOption(option => option.setName('reason').setDescription('The reason for banning this user').setRequired(true))
		.addStringOption(option => option.setName('duration').setDescription('The amount of time to ban this user for ("forever" for permanent)').setRequired(true)),
	async execute(interaction) {
		await interaction.deferReply();
		log.debug(`Getting staff status...`);
		if (!isStaff(interaction, interaction.member, PermissionFlagsBits.BanMembers)) return sendReply(interaction, 'main', 'You dont have the necessary permissions to complete this action');
		log.debug('User is staff');
		log.debug('Getting Target...');
		let target = await defineTarget(interaction, 'edit');
		if (target === undefined) {
			log.debug(`Target is undefined`);
			return;
		}

		log.debug(`Getting target Member...`);
		let targetMember;

		try {
			targetMember = await interaction.guild.members.fetch(target);
		} catch (error) {
			if (error.message.toLowerCase().includes('unknown member')) {
				targetMember = false;
			} else {
				targetMember = false;
				log.debug(`failed to fetch member`);
			}
		}

		if (targetMember) {
			log.debug(`Found target member: ${targetMember.user.username}`);
			let canDoAction = await hasHigherPerms(interaction.member, targetMember);
			if (!canDoAction) {
				log.debug(`Target member has higher permissions than the interaction user or the bot`);
				return sendReply(interaction, 'error', 'You or the bot does not have permissions to complete this action');
			}
		}

		log.debug(`Getting duration...`);
		log.debug(`Getting duration string...`);

		let duration = await defineDuration(interaction);
		let durationString = await defineDurationString(interaction);
		let banDate = new Date();

		log.debug(`duration: ${duration}`);
		log.debug(`duration string: ${durationString}`);
		log.debug(`ban date: ${banDate}`);

		let reason = interaction.options.getString('reason') ? interaction.options.getString('reason') : 'no reason provided';

		log.debug(`Reason: ${reason}`);

		if (targetMember) {
			await targetMember
				.send(
					`You have been banned from ${interaction.guild.name} for \`${reason}\`. The length of your ban is ${durationString}. If you want to appeal this ban, run the /appeal command and fill out the information! To run the /appeal command here in our DMs, you need to join the bot's server:\n${c.appealServer}`
				)
				.catch(() => {
					log.debug("Couldn't send user BAN message");
				});
		}

		log.debug(`Getting user pfp and name`);

		let aviURL = interaction.user.avatarURL({ extension: 'png', forceStatic: false, size: 1024 }) || interaction.user.defaultAvatarURL;
		let name = interaction.user.username;

		log.debug(`Got user PFP and name`);
		log.debug(`Creating guild ban`);

		interaction.guild.bans
			.create(target, {
				deleteMessageSeconds: 604800,
				reason: `${reason} | Duration: ${durationString} | Mod: ${interaction.user.username} (${interaction.user.id})`,
			})
			.catch(e => {
				log.error(`Error on banning user: ${target} | ${e}`);
				return sendReply(interaction, 'error', `Error banning member: ${e}`);
			});

		try {
			interaction.guild.bans
				.create(target, {
					deleteMessageSeconds: 604800,
					reason: `${reason} | Duration: ${durationString} | Mod: ${interaction.user.username} (${interaction.user.id})`,
				})
				.catch(e => {
					log.error(`Error on banning user: ${target} | ${e}`);
					return sendReply(interaction, 'error', `Error banning member: ${e}`);
				});
			log.debug(`Successfully created guild ban in ${interaction.guild.name}`);
			let banEmbed = new EmbedBuilder()
				.setTitle(`User Banned`)
				.setColor(colors.success)
				.setDescription(`Successfully banned <@${target}> for ${durationString}. Reason: ${reason}`)
				.setTimestamp()
				.setAuthor({ name: name, iconURL: aviURL });

			interaction.editReply({ embeds: [banEmbed] });

			log.debug(`Sending log embed`);

			let logEmbed = new EmbedBuilder()
				.setColor(colors.main)
				.setTitle('Member Banned')
				.addFields(
					{ name: 'User', value: `<@${target}> (${target})` },
					{ name: 'Reason', value: reason },
					{ name: 'Ban Duration', value: durationString },
					{ name: 'Moderator', value: `${name} (${interaction.user.id})` }
				)
				.setAuthor({ name: name, iconURL: aviURL })
				.setTimestamp();

			if (targetMember) {
				logEmbed.setThumbnail(
					targetMember.avatarURL({ extension: 'png', forceStatic: false, size: 1024 }) ? targetMember.avatarURL({ extension: 'png', forceStatic: false, size: 1024 }) : targetMember.defaultAvatarURL
				);
			}

			getModChannels(interaction.client, interaction.guild.id)
				.main.send({
					embeds: [logEmbed],
					content: `<@${target}>`,
				})
				.catch(e => {
					log.error(`Could not send log message: ${e}`);
				});

			log.debug(`Upserting ban record`);
			await prisma.ban
				.upsert({
					where: {
						userID_guildId: {
							userID: target,
							guildId: interaction.guild.id,
						},
					},
					update: {
						moderator: `${interaction.user.username} (${interaction.user.id})`,
						endDate: duration,
						reason: reason,
						startDate: banDate,
						duration: durationString,
					},
					create: {
						startDate: banDate,
						userID: target,
						guildId: interaction.guild.id,
						moderator: `${interaction.user.username} (${interaction.user.id})`,
						endDate: duration,
						reason: reason,
						duration: durationString,
					},
				})
				.catch(e => {
					log.error(`Error upserting ban record ${e}`);
				});
			await prisma.warning
				.create({
					data: {
						userID: target,
						date: banDate,
						guildId: interaction.guild.id,
						reason: reason,
						moderator: `${interaction.user.username} (${interaction.user.id})`,
						type: 'BAN',
					},
				})
				.catch(e => {
					log.error(`Error creating warning log: ${e}`);
				});
		} catch (e) {
			log.error(`Error banning user: ${e}`);
			return sendReply(interaction, 'error', `Error banning user: ${e}`);
		}
	},
};
