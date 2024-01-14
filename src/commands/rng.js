const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { isStaff } = require('../utils/isStaff');
const { extractSnowflake } = require('../utils/validate.js');
const { parseNewDate, durationToString, isValidDuration } = require('../utils/parseDuration.js');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const colors = require('../utils/embedColors');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('rng')
		.setDescription('Let fate decide')
		.addStringOption(option => option.setName('user').setDescription('The user'))
		.addStringOption(option => option.setName('reason').setDescription('The reason for subjecting this user to fate')),
	async execute(interaction) {
		await interaction.deferReply({ ephemeral: true });
		if (!isStaff(interaction, interaction.member, PermissionFlagsBits.BanMembers))
			return interaction.reply({
				content: "You're not staff, idiot",
				ephemeral: true,
			});

		await prisma.guild.upsert({
			where: { id: interaction.guild.id },
			update: {},
			create: { id: interaction.guild.id },
		});

		let target;

		if (!interaction.options.getString('user')) {
			return sendReply('error', 'No user entered');
		}

		let userString = interaction.options.getString('user');

		if (!extractSnowflake(userString)) {
			return sendReply('error', 'This is not a valid user');
		} else {
			target = extractSnowflake(userString)[0];
		}

		let aviURL = interaction.user.avatarURL({ format: 'png', dynamic: false }).replace('webp', 'png');
		let name = interaction.user.username;

		const reason = interaction.options.getString('reason') ? interaction.options.getString('reason') : 'no reason provided';

		interaction.channel.sendTyping();

		interaction.channel.send("Thank you for starting a game of RNG! Lets find out what this contestant's fate will be! Lets start by getting a random number between 1 and 1000...").then(m => {
			interaction.channel.sendTyping();
			setTimeout(() => {
				interaction.channel.sendTyping();
				const chosenTime = Math.floor(Math.random() * 1000) + 2;
				m.reply(`Ok, I have chosen the number ${chosenTime}! Now lets decide what unit this number should be in. Seconds? Minutes? Hours? let me think for a moment...`).then(m2 => {
					interaction.channel.sendTyping();
					const timeUnits = ['seconds', 'minutes', 'hours'];
					const randomIndex = Math.floor(Math.random() * timeUnits.length);
					const unit = timeUnits[randomIndex];
					setTimeout(() => interaction.channel.send('hmmmmmmmm.'), 2000);
					interaction.channel.sendTyping();
					setTimeout(() => {
						interaction.channel.sendTyping();
						m2.reply(`Alright, I've landed on ${unit}! Now all we have to do is figure out what exactly we're gonna do for ${chosenTime} ${unit}. Will it be a mute or a ban?`).then(m3 => {
							const pTypes = ['mute', 'ban'];
							const randomIndexPType = Math.floor(Math.random() * pTypes.length);
							const punishmentType = pTypes[randomIndexPType];
							interaction.channel.sendTyping();
							setTimeout(() => {
								m3.reply(`Alright, I've got it! This contestant will get a ${punishmentType}, for ${chosenTime} ${unit}! Thanks for playing RNG!!!`).then(m4 => {
									if (punishmentType === 'ban') {
										let banEmbed = new EmbedBuilder()
											.setTitle(`User Banned`)
											.setColor(colors.main)
											.setDescription(`Banned <@${target}> for ${chosenTime} ${unit}. Reason: ${reason}`)
											.setTimestamp()
											.setAuthor({ name: name, iconURL: aviURL });

										m4.reply({ embeds: [banEmbed] });

										interaction.editReply('RNG Complete');
									} else {
										let muteEmbed = new EmbedBuilder()
											.setTitle(`User Muted`)
											.setColor(colors.main)
											.setDescription(`Muted <@${target}> ${chosenTime} ${unit}. Reason: ${reason}`)
											.setTimestamp()
											.setAuthor({ name: name, iconURL: aviURL });

										m4.reply({ embeds: [muteEmbed] });

										interaction.editReply('RNG Complete');
									}
								});
							}, 6000);
						});
					}, 6000);
				});
			}, 6000);
		});
	},
};
