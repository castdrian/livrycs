import type { ApplicationCommandData, CommandInteraction } from 'discord.js';
import { MessageEmbed } from 'discord.js';
// eslint-disable-next-line import/no-named-default
import { default as dayjs } from 'dayjs';
import { fetchJSON, normalize } from '../utils.js';

export async function run(interaction: CommandInteraction): Promise<unknown> {
	await interaction.defer();

	const info = {
		season: interaction.options.get('season')?.value,
		episode: interaction.options.get('episode')?.value,
	};

	const show = {
		id: '39678',
		title: 'High School Musical: The Musical: The Series',
		channel: 'Disney+',
	};

	const api = `http://api.tvmaze.com/shows/${show.id}/episodebynumber?season=${info.season}&number=${info.episode}`;

	const body = await fetchJSON(api);
	if (body.status === 404)
		return interaction.editReply({
			embeds: [
				new MessageEmbed().setTitle(
					'There was no data for this episode!'
				),
			],
		});

	let sp = '';
	const today = new Date();
	const airdate = new Date(body.airdate);
	if (!dayjs(airdate).isValid()) sp = '||';
	if (today < airdate) sp = '||';
	const { airtime } = body;
	const desc = !body.summary
		? 'No summary available'
		: body.summary.replace('<p>', '').replace('</p>', '');
	let img;
	if (body.image == null) img = '';
	else img = body.image.original;

	let timeString = airtime;
	const H = timeString.split(':')[0];
	const h = H % 12 || 12;
	const amPm = H < 12 || H === 24 ? ' AM' : ' PM';
	timeString = `${h}:${timeString.split(':')[1]}${amPm}`;

	const embed = new MessageEmbed()
		.setColor('#938ACD')
		.setTitle(
			`${show.title} ${body.season}x${normalize(body.number)} - ${
				body.name
			}`
		)
		.setDescription(
			`${sp + desc + sp}\n\nAirdate: \`${
				dayjs(airdate).isValid()
					? airdate.toDateString()
					: 'No Airdate Available'
			}\`\nAirtime: \`${
				body.airtime === ''
					? 'No Airtime Available'
					: `${timeString} ET`
			}\`\nRuntime: \`${body.runtime} Minutes\`\nChannel: \`${
				show.channel
			}\`\n\n**[Full recap & trailer](${body.url} '${body.url}')**`
		)
		.setImage(img)
		.setFooter(
			'Livrycs | © adrifcastr',
			interaction.client.user?.displayAvatarURL() as string
		);

	return interaction.editReply({ embeds: [embed] });
}

export const data: ApplicationCommandData = {
	name: 'episode',
	description: 'Fetch HSMTMTS episode info.',
	options: [
		{
			name: 'season',
			description: 'The season of the show.',
			type: 'INTEGER',
			required: true,
		},
		{
			name: 'episode',
			description: 'The episode of the season.',
			type: 'INTEGER',
			required: true,
		},
	],
};
