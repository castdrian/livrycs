import type {
	ApplicationCommandData,
	CommandInteraction,
	Message,
	MessageComponentInteraction,
} from 'discord.js';
import { MessageEmbed, MessageButton } from 'discord.js';
import { Client } from 'genius-lyrics';
// @ts-ignore
import { getLyrics } from 'genius-lyrics-api';
import arrayShuffle from 'array-shuffle';
import type { GameData, SongInfo } from 'src/@types';

export async function run(interaction: CommandInteraction): Promise<unknown> {
	await interaction.defer();
	const genius = new Client(process.env.GENIUS_KEY);

	const songs = [
		6702223, 5506107, 6745675, 5056283, 5241100, 5127258, 5346647, 5595696,
		5549474, 6702206, 5376418, 5985136, 6745644, 6745660, 6649389, 6745590,
		6707924, 6364094, 6840151, 6478902, 6840150, 6702234, 6702238, 6702232,
		6905308, 6875494, 5365046, 5416223, 6961691, 6961627, 6745622, 6745581,
		6702222, 5487926, 5005761, 6702237, 6747605, 6091199, 6745653, 5837270,
		6748802, 6745628, 6745600, 6748926, 5416118, 5499588, 5469678, 5109186,
		5469637, 5470115, 5487953, 6185797, 5068041, 6748825, 5005765, 6748882,
		6289486, 6852438, 6747612, 5416193, 6804255, 6745609, 6702211, 6748907,
		5499671, 5897782, 6858319, 5697646, 5759069, 6745615, 6836079,
	];

	async function SongData(): Promise<SongInfo> {
		const song = songs[Math.floor(Math.random() * songs.length)];

		const metadata = await genius.songs.get(song);
		const lyrics: string = await getLyrics(metadata.url).catch(
			console.error
		);

		const parts = lyrics
			?.split(/\[.+?\]/)
			.map((x) => x.split('\n').filter((e) => e))
			.filter((x) => x.length >= 5);

		const verse = parts[Math.floor(Math.random() * parts.length)];
		return { lyrics, verse, metadata };
	}
	async function gameEmbed(): Promise<GameData> {
		const data = await SongData();
		// eslint-disable-next-line prefer-const
		let { verse, lyrics } = data;
		// eslint-disable-next-line no-await-in-loop
		while (!verse) verse = (await SongData()).verse;

		const lines = verse.slice(0, 5);
		const index = Math.floor(Math.random() * lines.length);
		const solution = lines[index];
		const splice = lines;
		splice.splice(index, 1, '`?????????????`');
		const desc = splice.join('\n');

		const all = lyrics
			.replace(/\[.+?\]/g, '')
			.split('\n')
			.filter(
				(x: string) =>
					x && x !== 'Lyrics from Snippet:' && x !== solution
			);
		const opts = arrayShuffle(all).slice(0, 2) as string[];

		const choices = [
			new MessageButton()
				.setStyle('PRIMARY')
				.setLabel(solution)
				.setCustomID('correct'),
			new MessageButton()
				.setStyle('PRIMARY')
				.setLabel(opts[0])
				.setCustomID('incorrect'),
			new MessageButton()
				.setStyle('PRIMARY')
				.setLabel(opts[1])
				.setCustomID('incorrect'),
		];

		const answers = arrayShuffle(choices);

		const buttons = [
			new MessageButton()
				.setStyle('SUCCESS')
				.setLabel('Skip')
				.setCustomID('skip'),
			new MessageButton()
				.setStyle('DANGER')
				.setLabel('Cancel')
				.setCustomID('cancel'),
		];

		const embed = new MessageEmbed()
			.setColor('#938ACD')
			.setAuthor(
				data.metadata.artist.name,
				data.metadata.artist.thumbnail
			)
			.setTitle(data.metadata.title)
			.setURL(data.metadata.url)
			.setThumbnail(data.metadata.image)
			.setDescription(desc)
			.setFooter(
				'Livrycs | © adrifcastr',
				interaction.client.user?.displayAvatarURL() as string
			);

		const obj: GameData = {
			embeds: [embed],
			components: [[answers[0]], [answers[1]], [answers[2]], buttons],
		};

		return obj;
	}

	const buttons = [
		new MessageButton()
			.setStyle('SUCCESS')
			.setLabel('Another one!')
			.setCustomID('skip'),
		new MessageButton()
			.setStyle('DANGER')
			.setLabel("I'm done.")
			.setCustomID('cancel'),
	];

	const data = await gameEmbed();
	await interaction.editReply(data);
	let ended = false;
	setTimeout(() => {
		const embed = new MessageEmbed()
			.setColor('#938ACD')
			.setDescription(
				'The game has timed out.\nYou can start a new one. <:sour:845971068195438603>'
			)
			.setThumbnail(interaction.client.user?.displayAvatarURL() as string)
			.setFooter(
				'Livrycs | © adrifcastr',
				interaction.client.user?.displayAvatarURL() as string
			);
		if (!ended) {
			interaction.editReply({
				embeds: [embed],
				components: [],
			});
		}
	}, 840000);

	const message = (await interaction.fetchReply()) as Message;
	const filter = (i: MessageComponentInteraction) =>
		i.user.id === interaction.user.id;
	// @ts-ignore
	const collector = message.createMessageComponentInteractionCollector({
		filter,
		time: 20000,
	});

	collector.on('collect', async (i) => {
		if (i.customID === 'skip') {
			collector.resetTimer();
			ended = false;
			const newdata = await gameEmbed();
			await interaction.editReply(newdata);
			collector.resetTimer();
		} else if (i.customID === 'cancel') {
			ended = true;
			await interaction.editReply({ components: [] });
		} else if (i.customID === 'correct') {
			const embed = new MessageEmbed()
				.setColor('#938ACD')
				.setDescription(
					'Your answer was correct! <:sour:845971068195438603>'
				)
				.setThumbnail(
					interaction.client.user?.displayAvatarURL() as string
				)
				.setFooter(
					'Livrycs | © adrifcastr',
					interaction.client.user?.displayAvatarURL() as string
				);
			ended = true;

			await interaction.editReply({
				embeds: [embed],
				components: [buttons],
			});
		} else if (i.customID === 'incorrect') {
			const embed = new MessageEmbed()
				.setColor('#938ACD')
				.setDescription(
					'Your answer was wrong! <:sour:845971068195438603>'
				)
				.setThumbnail(
					interaction.client.user?.displayAvatarURL() as string
				)
				.setFooter(
					'Livrycs | © adrifcastr',
					interaction.client.user?.displayAvatarURL() as string
				);
			ended = true;

			await interaction.editReply({
				embeds: [embed],
				components: [buttons],
			});
		}
	});

	// @ts-ignore
	return collector.on('end', async () => {
		const embed = new MessageEmbed()
			.setColor('#938ACD')
			.setDescription(
				'The game has timed out.\nYou can start a new one. <:sour:845971068195438603>'
			)
			.setThumbnail(interaction.client.user?.displayAvatarURL() as string)
			.setFooter(
				'Livrycs | © adrifcastr',
				interaction.client.user?.displayAvatarURL() as string
			);

		if (!ended) {
			ended = true;
			interaction.editReply({
				embeds: [embed],
				components: [],
			});
		}
	});
}

export const data: ApplicationCommandData = {
	name: 'play',
	description: 'Play Livrycs',
};
