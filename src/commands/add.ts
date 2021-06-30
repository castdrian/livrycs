import type { ApplicationCommandData, CommandInteraction } from 'discord.js';
import { MessageButton } from 'discord.js';

export async function run(interaction: CommandInteraction): Promise<unknown> {
	const url =
		'https://discord.com/api/oauth2/authorize?client_id=859760543602311218&permissions=0&scope=applications.commands%20bot';
	const button = new MessageButton()
		.setStyle('LINK')
		.setLabel('Add me!')
		.setURL(url);

	return interaction.reply({
		content: 'Oauth2 Invite:',
		components: [[button]],
	});
}

export const data: ApplicationCommandData = {
	name: 'add',
	description: 'Invite Livrycs.',
};
