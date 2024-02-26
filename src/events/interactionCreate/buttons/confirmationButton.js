const { sendReply } = require('../../../utils/sendReply');
const { emojis } = require('../../../config');
const prisma = require('../../../utils/prismaClient');
const log = require('../../../utils/log');

async function confirmationButton(interaction) {
	log.debug('begin');
	await interaction.deferReply({ ephemeral: true });
	if (!interaction.message) return;
	if (!interaction.message.id) return;
	if (!interaction.guild) return;
	if (!interaction.user) return;

	sendReply(interaction, 'main', `${emojis.loading}  Sending confirmation...`);

	let confirmation = false;
	try {
		confirmation = await prisma.confirmation.findUnique({
			where: {
				messageID: interaction.message.id,
			},
		});
	} catch (error) {
		log.error('Error fetching confirmation:', error);
	}

	if (!confirmation) return;

	let targetMember;
	try {
		targetMember = await interaction.guild.members.fetch(interaction.user.id);
	} catch (error) {
		if (error.message.toLowerCase().includes('unknown member')) {
			targetMember = false;
			return;
		} else {
			targetMember = false;
			return;
		}
	}

	targetMember.roles
		.add(confirmation.roleID)
		.then(() => {
			log.debug('end');
			return sendReply(interaction, 'main', `${emojis.success}  Role added!`);
		})
		.catch(e => {
			log.error(`Error adding role: ${e}`);
			return sendReply(interaction, 'main', `${emojis.error}  Failed to add role: ${e}`);
		});
}

module.exports = { confirmationButton };
