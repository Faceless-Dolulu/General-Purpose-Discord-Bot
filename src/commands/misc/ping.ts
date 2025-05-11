import { SlashCommandProps } from "commandkit";
import { SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
	.setName(`ping`)
	.setDescription(`Displays the current latency for Loki`);

export async function run({ interaction, client }: SlashCommandProps) {
	await interaction.deferReply();
	const reply = await interaction.fetchReply();
	const ping = reply.createdTimestamp - interaction.createdTimestamp;

	await interaction.followUp(
		`ℹ️ Client ping is ${ping}ms | Websocket ping is ${client.ws.ping}ms`
	);
}
