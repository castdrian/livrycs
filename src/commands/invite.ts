import type { ApplicationCommandData, CommandInteraction } from 'discord.js';

export async function run(interaction: CommandInteraction): Promise<unknown> {
	return interaction.reply('https://discord.gg/qWMKnbXHgs');
}

export const data: ApplicationCommandData = {
	name: 'invite',
	description: 'Join the Livies guild.',
};
