import type { ApplicationCommandData, CommandInteraction } from 'discord.js';
import { MessageEmbed } from 'discord.js';
import { fetchJSON } from '../utils.js';

export async function run(interaction: CommandInteraction): Promise<unknown> {
  await interaction.defer();
  const start = process.hrtime.bigint();

  return fetchJSON('https://discord.com/api/v9/gateway').then(
    () => {
      const took = (process.hrtime.bigint() - start) / BigInt('1000000');

      const embed = new MessageEmbed()
        .setColor('#938ACD')
        .setDescription(
          `WebSocket ping: ${interaction.client.ws.ping.toFixed(
            2
          )} ms\nREST ping: ${took} ms`
        )
        .setThumbnail(interaction.client.user?.displayAvatarURL() as string)
        .setFooter('Livrycs | © adrifcastr');

      interaction.editReply({ embeds: [embed] });
    },
    (failed) => {
      console.log(failed);
      interaction.editReply('Failed to measure ping!');
    }
  );
}

export const data: ApplicationCommandData = {
  name: 'ping',
  description: "Shows Livrycs' ping.",
};
