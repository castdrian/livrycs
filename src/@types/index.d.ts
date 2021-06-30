import Discord from 'discord.js';

declare module 'discord.js' {
	interface Client {
		commands: Discord.Collection<string, Command>;
		events: Discord.Collection<string, Event>;
		owner: string;
	}
}

interface Command {
	data: Discord.ApplicationCommandData;
	run(interaction: Discord.CommandInteraction): Promise<unknown>;
}

interface Event {
	name: string;
	once?: boolean;
	process?: boolean;
	run(...args: unknown[]): Promise<void>;
}

interface GameData {
	embeds: Array<Discord.MessageEmbed>;
	components: Array<Array<Discord.MessageActionRowComponentResolvable>>;
}
