import {
	InteractionContextType,
	PermissionFlagsBits,
	SlashCommandBuilder,
} from "discord.js";
import funCommands from "./fun-commands.js";
import { SlashCommandProps } from "commandkit";
import { openSettingsMenuCache } from "../../util/settings-menu-open.js";

export const data = new SlashCommandBuilder()
	.setName(`configuration`)
	.setDescription(`Configure settings for your server`)
	.setContexts(InteractionContextType.Guild)
	.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
	.addSubcommand((command) =>
		command
			.setName(`fun`)
			.setDescription(`Configure fun command settings for your server`)
	);

export async function run({ interaction }: SlashCommandProps) {
	const command = interaction.options.getSubcommand();
	openSettingsMenuCache.set(interaction.guildId as string, true);
	switch (command) {
		case "fun":
			return funCommands.run(interaction);
	}
}
