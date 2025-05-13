import { ValidationProps } from "commandkit";
import { MessageFlags } from "discord.js";
import { CooldownScope, isOnCooldown } from "../util/command-on-cooldown.js";

export default async function ({ interaction, commandObj }: ValidationProps) {
	if (!interaction.isChatInputCommand() || !commandObj.options?.cooldown)
		return false;
	const cooldown = commandObj.options?.cooldown;
	const cooldownScope = (commandObj.options?.cooldownScope ??
		"guild") as CooldownScope;
	const result = isOnCooldown(
		interaction.user.id,
		interaction.commandName,
		cooldown,
		cooldownScope,
		interaction.guildId ?? undefined
	);

	if (result.onCooldown) {
		await interaction.reply({
			content: `⏳ You are on cooldown! Try again in ${Math.ceil(
				result.retryAfter / 1000
			)} seconds`,
			flags: MessageFlags.Ephemeral,
		});
		return true;
	}
	return false;
}
