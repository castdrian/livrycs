/* eslint-disable no-underscore-dangle */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable consistent-return */
import type { Client, Snowflake } from 'discord.js';
import {
	CommandInteraction,
	WebhookClient,
	Util,
	MessageEmbed,
} from 'discord.js';
import recursive from 'recursive-readdir';
import path from 'path';
import Md5 from 'md5';
import fetch from 'node-fetch';
import type { Command } from 'src/@types';

const { log } = console;

// eslint-disable-next-line func-names
console.log = function (message: any, conly: boolean) {
	let url = process.env.LOG_WEBHOOK_URL;
	if (url && !conly) {
		url = url
			.replace('https://discordapp.com/api/webhooks/', '')
			.replace('https://discord.com/api/webhooks/', '');
		const split = url.split('/');
		if (split.length < 2) return;

		const client = new WebhookClient(split[0] as Snowflake, split[1]);

		// eslint-disable-next-line no-param-reassign
		if (message instanceof Error)
			// eslint-disable-next-line no-param-reassign
			message = message.stack ?? message.message;

		// eslint-disable-next-line eqeqeq
		if (typeof message == 'string') {
			// eslint-disable-next-line no-restricted-syntax
			for (const msg of Util.splitMessage(message, { maxLength: 1980 })) {
				client.send({ content: msg, username: 'Livrycs-Logs' });
			}
		} else client.send({ embeds: [message], username: 'Livrycs-Logs' });

		if (!(message instanceof MessageEmbed)) {
			// eslint-disable-next-line no-param-reassign
			message = message.replace(/`/g, '').trim();
		}
	}
	return log.apply(console, [message]);
};

export function fetchJSON(url: string): Promise<any> {
	// eslint-disable-next-line no-async-promise-executor
	return new Promise(async (resolve, reject) => {
		if (!url || typeof url !== 'string') return reject(new Error('No URL'));

		try {
			const res = await fetch(url);
			resolve(await res.json());
		} catch (e) {
			reject(e);
		}
	});
}

export function truncate(
	str: string,
	length: number,
	useWordBoundary: boolean
): string {
	if (str.length <= length) return str;
	const subString = str.substr(0, length - 1);
	return `${
		useWordBoundary
			? subString.substr(0, subString.lastIndexOf(' '))
			: subString
	}...`;
}

export function GenerateSnowflake(): string {
	let rv = '';
	const possible = '1234567890';

	// eslint-disable-next-line no-plusplus
	for (let i = 0; i < 19; i++)
		rv += possible.charAt(Math.floor(Math.random() * possible.length));
	return rv;
}

export function normalize(num: number): string {
	if (typeof num === 'undefined' || typeof num !== 'number') return '';
	return num.toLocaleString(undefined, {
		minimumIntegerDigits: 2,
		useGrouping: false,
	});
}

export async function LoadEvents(livrycs: Client): Promise<void> {
	return new Promise((resolve, reject) => {
		const start = process.hrtime.bigint();

		recursive('./events', async (err, files) => {
			if (err) {
				console.log(`Error while reading events:\n${err}`);
				return reject(err);
			}

			const jsfiles = files.filter(
				(fileName) =>
					fileName.endsWith('.js') &&
					!path.basename(fileName).startsWith('_')
			);
			if (jsfiles.length < 1) {
				console.log('No events to load!');
				return reject(new Error('No events!'));
			}

			console.log(`Found ${jsfiles.length} events`);

			// eslint-disable-next-line no-restricted-syntax
			for (const filePath of jsfiles) {
				const strt = process.hrtime.bigint();

				// eslint-disable-next-line no-await-in-loop
				const props = await import(`./${filePath}`);

				livrycs.events.set(props.default.name, props.default);

				const end = process.hrtime.bigint();
				const took = (end - strt) / BigInt('1000000');

				console.log(
					`${normalize(
						jsfiles.indexOf(filePath) + 1
					)} - ${filePath} loaded in ${took}ms`,
					true
				);
			}

			const end = process.hrtime.bigint();
			const took = (end - start) / BigInt('1000000');
			console.log(`All events loaded in \`${took}ms\``);
			resolve();
		});
	});
}

export async function LoadCommands(livrycs: Client): Promise<void> {
	return new Promise((resolve, reject) => {
		const start = process.hrtime.bigint();

		recursive('./commands', async (err, files) => {
			if (err) {
				console.log(`Error while reading commands:\n${err}`);
				return reject(err);
			}

			const jsfiles = files.filter(
				(fileName) =>
					fileName.endsWith('.js') &&
					!path.basename(fileName).startsWith('_')
			);
			if (jsfiles.length < 1) {
				console.log('No commands to load!');
				return reject(new Error('No commmands'));
			}

			console.log(`Found ${jsfiles.length} commands`);

			// eslint-disable-next-line no-restricted-syntax
			for (const filePath of jsfiles) {
				const cmdStart = process.hrtime.bigint();

				// eslint-disable-next-line no-await-in-loop
				const props: Command = await import(`./${filePath}`);

				livrycs.commands.set(props.data.name, props);

				const cmdEnd = process.hrtime.bigint();
				const took = (cmdEnd - cmdStart) / BigInt('1000000');

				console.log(
					`${normalize(
						jsfiles.indexOf(filePath) + 1
					)} - ${filePath} loaded in ${took}ms`,
					true
				);
			}

			const end = process.hrtime.bigint();
			const took = (end - start) / BigInt('1000000');
			console.log(`All commands loaded in \`${took}ms\``);

			resolve();
		});
	});
}

export function delay(inputDelay: number): Promise<void> {
	// If the input is not a number, instantly resolve
	if (typeof inputDelay !== 'number') return Promise.resolve();
	// Otherwise, resolve after the number of milliseconds.
	return new Promise((resolve) => setTimeout(resolve, inputDelay));
}

export async function DeployCommands(livrycs: Client): Promise<void | boolean> {
	const data = [];
	// eslint-disable-next-line no-restricted-syntax
	for (const item of livrycs.commands.values()) data.push(item.data);

	if (livrycs.user?.id === process.env.PROD_CLIENT_ID) {
		const globalcmds = await livrycs.application?.commands.fetch();

		if (!globalcmds) {
			await livrycs.application?.commands.set(data);
			return console.log('Application Commands deployed!');
		}

		if (globalcmds?.size !== livrycs.commands.size) {
			await livrycs.application?.commands.set(data);
			return console.log('Application Commands deployed!');
		}

		const globalfilter = data
			.map((x) => x.options)
			.filter(
				(x) =>
					x !== undefined &&
					(x as unknown as boolean) !== Array.isArray(x) &&
					x.length
			);
		const localfilter = globalcmds
			.map((x) => x.options)
			.filter(
				(x) =>
					x !== undefined &&
					(x as unknown as boolean) !== Array.isArray(x) &&
					x.length
			);

		const globallocalhash = Md5(JSON.stringify(globalfilter));
		const globalhash = Md5(JSON.stringify(localfilter));

		if (globallocalhash !== globalhash) {
			await livrycs.application?.commands.set(data);
		}
		return console.log('Application Commands deployed!');
	}

	if (livrycs.user?.id === process.env.DEV_CLIENT_ID) {
		await livrycs.guilds.cache
			.get(process.env.DEV_GUILD_ID as Snowflake)
			?.commands.set(data);
		return console.log('Application Commands deployed!');
	}
}

export async function CITest(livrycs: Client): Promise<void> {
	console.log('Starting CI test');

	if (!livrycs.options.http) return;

	// eslint-disable-next-line no-param-reassign
	livrycs.options.http.api = 'https://gideonbot.com/api/dump';

	const tests = await import('./tests.js');

	const channel_id = GenerateSnowflake();
	const guild_id = GenerateSnowflake();

	const user = {
		id: livrycs.owner,
		username: 'Test',
		discriminator: '0001',
		avatar: null,
		bot: false,
		system: false,
		flags: 64,
	};

	const member = {
		user,
		nick: null,
		roles: [],
		joined_at: new Date().toISOString(),
		deaf: false,
		mute: false,
	};

	livrycs.guilds.add({
		name: 'Test',
		region: 'US',
		member_count: 2,
		large: false,
		features: [],
		embed_enabled: true,
		premium_tier: 0,
		verification_level: 1,
		explicit_content_filter: 1,
		mfa_level: 0,
		joined_at: new Date().toISOString(),
		default_message_notifications: 0,
		system_channel_flags: 0,
		id: guild_id,
		unavailable: false,
		roles: [
			{
				id: guild_id,
				name: '@everyone',
				color: 3447003,
				hoist: true,
				position: 1,
				permissions: 66321471,
				managed: false,
				mentionable: false,
			},
		],
		members: [
			{
				user: livrycs.user?.toJSON(),
				nick: null,
				roles: [],
				joined_at: new Date().toISOString(),
				deaf: false,
				mute: false,
			},
			member,
		],
		owner_id: user.id,
	});

	livrycs.channels.add({
		nsfw: false,
		name: 'test-channel',
		type: 0,
		guild_id,
		id: channel_id,
	});

	// eslint-disable-next-line no-restricted-syntax
	for (const item of tests.commands) {
		const interaction = new CommandInteraction(livrycs, {
			type: 2,
			token: 'lol',
			id: GenerateSnowflake(),
			channel_id,
			guild_id,
			member,
			data: item,
		});

		livrycs.emit('interaction', interaction);
	}

	// We need to wait for all requests to go through
	await delay(5e3);

	// eslint-disable-next-line no-constant-condition
	while (true) {
		console.log('Checking if all requests are over...');
		// eslint-disable-next-line no-underscore-dangle
		if (
			// @ts-ignore
			!livrycs.rest.handlers
				.array()
				// @ts-ignore
				.map((x) => x._inactive)
				// @ts-ignore
				.some((x) => !x)
		)
			break;
		// eslint-disable-next-line no-await-in-loop
		await delay(2e3);
	}

	console.log('Run successful, exiting with code 0');
	livrycs.destroy();
	process.exit();
}
