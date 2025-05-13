import { ValidationProps } from "commandkit";
import { settingsMenuOpen } from "../util/settings-menu-open.js";
import { MessageFlags } from "discord.js";

export default async function ({ interaction, commandObj }: ValidationProps) {
	if (
		!interaction.isChatInputCommand() ||
		commandObj.category !== `guild_configuration`
	) {
		return false;
	}

	const result = settingsMenuOpen(interaction.guildId as string);

	if (result === true) {
		await interaction.reply({
			content: `⛔ Another user is configuring server settings. Please wait until they are finished in order to prevent data corruption`,
			flags: MessageFlags.Ephemeral,
		});
		return true;
	}
	return false;
}
