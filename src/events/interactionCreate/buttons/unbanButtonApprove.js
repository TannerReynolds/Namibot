const { sendReply } = require('../../../utils/sendReply');
const { colors, emojis, guilds } = require('../../../config');
const { EmbedBuilder } = require('discord.js');
const prisma = require('../../../utils/prismaClient');
const { getModChannels } = require('../../../utils/getModChannels');

async function unbanButtonApprove(interaction, args) {
	await interaction.deferReply({ ephemeral: true });
	let target = args[1];
	let targetUser = false;
	try {
		targetUser = await interaction.client.users.fetch(target);
	} catch (e) {
		//do nothing
	}
	let name = interaction.user.username;
	let aviURL = interaction.user.avatarURL({ extension: 'png', forceStatic: false, size: 1024 }) || interaction.user.defaultAvatarURL;
	let reason = 'Ban Appeal Approved';

	if (interaction.channel.locked || interaction.channel.archived) return sendReply(interaction, 'error', `${emojis.error}  This channel is locked`);

	interaction.guild.bans
		.remove(target, {
			reason: `${reason} | Mod: ${interaction.user.username} (${interaction.user.id})`,
		})
		.then(async () => {
			let unbanEmbed = new EmbedBuilder()
				.setTitle(`User Unbanned`)
				.setColor(colors.success)
				.setDescription(`${emojis.success}  Successfully unbanned <@${target}>. Reason: ${reason}`)
				.setTimestamp()
				.setAuthor({ name: name, iconURL: aviURL });

			await interaction.channel.send({ embeds: [unbanEmbed] });
			await interaction.channel.setArchived(true);
			await sendReply(interaction, 'main', `${emojis.success}  Interaction Complete`);
			if (reason.length > 1024) {
				reason = `${reason.substring(0, 950)}...\`[REMAINDER OF MESSAGE TOO LONG TO DISPLAY]\``;
			}
			let logEmbed = new EmbedBuilder()
				.setColor(colors.main)
				.setTitle('Member Unbanned')
				.addFields({ name: 'User', value: `<@${target}> (${target})` }, { name: 'Reason', value: reason }, { name: 'Moderator', value: `${name} (${interaction.user.id})` })
				.setAuthor({ name: name, iconURL: aviURL })
				.setTimestamp();

			await getModChannels(interaction.client, interaction.guild.id).main.send({
				embeds: [logEmbed],
				content: `<@${target}>`,
			});
			if (targetUser) {
				try {
					await targetUser.send(`You have been unbanned from ${interaction.guild.name}. Reason: ${reason}\nFeel free to rejoin through this link: ${guilds[interaction.guild.id].invite}`);
				} catch (e) {
					// do nothing
				}
			}
		})
		.catch(e => {
			return sendReply(interaction, 'error', `${emojis.error}  Error unbanning member: ${e}`);
		});

	await prisma.ban
		.delete({
			where: {
				userID_guildId: {
					userID: target,
					guildId: interaction.guild.id,
				},
			},
		})
		.catch(() => {
			// do nothing
			// Means they were banned not using the bot if this fails
		});
}

module.exports = { unbanButtonApprove };
