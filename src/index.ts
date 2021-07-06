import { Client, Collection } from 'discord.js';
import dotenv from 'dotenv';
import PrettyError from 'pretty-error';
import { LoadEvents } from './utils.js';

dotenv.config({ path: '../.env' });
PrettyError.start().withoutColors();

const livrycs = new Client({
	intents: 1,
	shards: 'auto',
	allowedMentions: { parse: ['users', 'roles'], repliedUser: true },
	restRequestTimeout: 25000,
});

livrycs.commands = new Collection();
livrycs.events = new Collection();

LoadEvents(livrycs).then(() => {
	// eslint-disable-next-line no-restricted-syntax
	for (const event of livrycs.events.values()) {
		if (event.process) {
			if (event.once) {
				// @ts-expect-error dis is valid bro
				process.once(event.name, (...args) => event.run(...args));
			} else process.on(event.name, (...args) => event.run(...args));
			// eslint-disable-next-line max-len
		} else if (event.once) {
			livrycs.once(event.name, (...args: unknown[]) =>
				event.run(...args, livrycs)
			);
		} else {
			livrycs.on(event.name, (...args: unknown[]) =>
				event.run(...args, livrycs)
			);
		}
	}

	if (process.env.CLIENT_TOKEN) {
		livrycs.login(process.env.CLIENT_TOKEN);
	} else {
		console.log('No client token!');
		process.exit(1);
	}
});

setTimeout(() => {
	if (process.env.CI) {
		console.log(
			'Exiting because CI was detected but cycle was not complete!'
		);
		process.exit(1);
	}
}, 120e3);
