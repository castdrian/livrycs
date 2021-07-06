/* eslint-disable no-param-reassign */
import { Client, ClientApplication, User, Team } from 'discord.js';
import LCL from 'last-commit-log';
import {
	LoadCommands,
	DeployCommands,
	GenerateSnowflake,
	CITest,
} from '../../utils.js';

export default {
	name: 'ready',
	once: true,
	async run(livrycs: Client): Promise<void> {
		if (process.env.CI) livrycs.owner = GenerateSnowflake();
		else {
			const app = await livrycs.application
				?.fetch()
				.catch((x) => console.log(`Failed to fetch owner: ${x}`));
			if (
				app &&
				app instanceof ClientApplication &&
				app.owner &&
				app.owner instanceof User
			) {
				livrycs.owner = app.owner.id;
			} else if (
				app &&
				app instanceof ClientApplication &&
				app.owner &&
				app.owner instanceof Team
			) {
				livrycs.owner = app.owner.ownerID as string;
			}
		}

		await LoadCommands(livrycs);
		await DeployCommands(livrycs);

		console.log('Ready!');

		livrycs.user?.setActivity({
			type: 'LISTENING',
			name: 'to Olivia Rodrigo',
		});

		setInterval(
			() =>
				livrycs.user?.setActivity({
					type: 'LISTENING',
					name: 'to Olivia Rodrigo',
				}),
			60 * 60 * 1000
		);

		const lcl = new LCL('../');
		const commit = await lcl.getLastCommit();
		if (commit)
			console.log(
				`Logged in as \`${livrycs.user?.tag}\`.\n[#${commit.shortHash}](<${commit.gitUrl}/commit/${commit.hash}>) - \`${commit.subject}\` by \`${commit.committer.name}\` on branch [${commit.gitBranch}](<${commit.gitUrl}/tree/${commit.gitBranch}>).`
			);
		if (process.env.CI) CITest(livrycs);
	},
};
