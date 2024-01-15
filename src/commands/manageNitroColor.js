const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { sendReply } = require('../utils/sendMsg.js');
const { checkPermissions } = require('../utils/permissionsCheck.js');
const { isSnowflake, isEmoji } = require('../utils/validate.js');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

module.exports = {
	data: new SlashCommandBuilder()
		.setName('managenitrocolor')
		.setDMPermission(false)
		.setDescription('Manage the nitro colors for the guild')
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
		.addStringOption(option =>
			option.setName('action').setDescription('Adding or removing a nitro role?').addChoices({ name: 'Add', value: 'add' }, { name: 'Remove', value: 'remove' }).setRequired(true)
		)
		.addStringOption(option => option.setName('role-id').setDescription("ID of the role you'd like to add").setRequired(true))
		.addStringOption(option => option.setName('emoji').setDescription('Emoji to use for the role')),
	async execute(interaction) {
		await prisma.guild.upsert({
			where: { id: interaction.guild.id },
			update: {},
			create: { id: interaction.guild.id },
		});

		let action = interaction.options.getString('action');
		let roleID = interaction.options.getString('role-id');
		let emoji = interaction.options.getString('emoji') ? interaction.options.getString('emoji') : null;

		let validRole = await isSnowflake(roleID);
		if (!validRole) {
			return sendReply(interaction, 'error', 'Invalid role input. Must be a valid snowflake representing the role.');
		}

		let validEmoji = await isEmoji(emoji);
		if (!validEmoji && action === 'add') {
			return sendReply(interaction, 'error', 'Invalid emoji input');
		}

		if (action === 'add') {
			let roleObj = await interaction.guild.roles.fetch(roleID);
			if (roleObj === null) {
				return sendReply(interaction, 'error', 'The supplied role does not exist');
			}
			await prisma.nitroColor.create({
				data: {
					roleID: roleID,
					emoji: emoji,
					name: roleObj.name,
					guildId: interaction.guild.id,
				},
			});
			sendReply(interaction, 'success', 'Added role to nitro color list!');
		} else {
			try {
				await prisma.nitroColor.delete({
					where: {
						roleID_guildId: {
							roleID: roleID,
							guildId: interaction.guild.id,
						},
					},
				});
				sendReply(interaction, 'success', 'Deleted role from list!');
			} catch (err) {
				console.log(err);
				sendReply(interaction, 'error', 'Could not delete role');
			}
		}
	},
};
