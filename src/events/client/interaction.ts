import type { Interaction, Client } from 'discord.js';

export default {
	name: 'interaction',
	async run(interaction: Interaction, livrycs: Client): Promise<unknown> {
		if (interaction.isCommand()) {
			if (!interaction.guild)
				return interaction.reply({
					content: 'DM commands are not supported!',
					ephemeral: true,
				});

			if (!livrycs.commands.has(interaction.commandName)) return null;

			try {
				const cmd = await livrycs.commands
					.get(interaction.commandName)
					?.run(interaction);
				return cmd;
			} catch (error) {
				if (interaction.deferred || interaction.replied) {
					await interaction.followUp({
						content: `There was an error while executing this command!\n\`${error.message}\``,
						ephemeral: true,
					});
				} else {
					await interaction.reply({
						content: `There was an error while executing this command!\n\`${error.message}\``,
						ephemeral: true,
					});
				}
				return console.error(error.stack);
			}
		} else if (interaction.isButton()) {
			await interaction.deferUpdate();
			return null;
		} else return null;
	},
};
