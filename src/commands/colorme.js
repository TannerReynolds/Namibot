const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ComponentType } = require('discord.js');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

module.exports = {
	data: new SlashCommandBuilder().setDMPermission(false).setName('colorme').setDescription('Select a color for yourself!'),
	async execute(interaction) {
		let authorRoles = interaction.member.roles.cache;
		let boosterRole = interaction.guild.roles.premiumSubscriberRole.id || null;

		if (!authorRoles.has(boosterRole) && interaction.user.id !== '478044823882825748') {
			return sendReply(interaction, 'error', 'You are not a nitro booster');
		}

		await prisma.guild.upsert({
			where: { id: interaction.guild.id },
			update: {},
			create: { id: interaction.guild.id },
		});

		let dropdown = new StringSelectMenuBuilder().setCustomId('roleselect').setPlaceholder('Make a selection!');

		let nitroColors = await prisma.nitroColor.findMany({
			where: {
				guildId: interaction.guild.id,
			},
		});

		let nitroRoleIDs = [];

		for (let i = 0; i < nitroColors.length; i++) {
			nitroRoleIDs.push(nitroColors[i].roleID);
			dropdown.addOptions(new StringSelectMenuOptionBuilder().setEmoji(extractSnowflake(nitroColors[i].emoji)).setLabel(nitroColors[i].name).setValue(nitroColors[i].roleID));
		}

		let row = new ActionRowBuilder().addComponents(dropdown);

		let response = await interaction.reply({
			components: [row],
		});

		let collector = response.createMessageComponentCollector({
			componentType: ComponentType.StringSelect,
			time: 3_600_000,
		});

		collector.on('collect', async i => {
			if (i.user.id !== interaction.user.id) return;
			let selection = i.values[0];
			i.deferReply();

			let iMember = await interaction.guild.members.fetch(i.user.id);
			// take away any other nitro role a user has
			const delRole = async () => {
				for (let i = 0; i < nitroRoleIDs.length; i++) {
					if (iMember.roles.cache.has(nitroRoleIDs[i])) {
						await interaction.member.roles.remove(nitroRoleIDs[i]);
					}
				}
			};

			await delRole();
			await interaction.member.roles.add(selection);
			let roleGiveEmbed = baseEmbed.setTitle('New color given!');
			await i.editReply({ embeds: [roleGiveEmbed] }).then(m => {
				setTimeout(function () {
					m.delete();
				}, 5000);
			});
		});

		function sendReply(interaction, type, message) {
			let replyEmbed = new EmbedBuilder().setColor(colors[type]).setDescription(message).setTimestamp();

			interaction.reply({ embeds: [replyEmbed] });
		}
	},
};

function extractSnowflake(str) {
	const regex = /(?<=\:)(\d+)(?=\>)/;
	const match = str.match(regex);
	return match ? match[0] : null;
}
