import { ValidationProps } from "commandkit";
import { MessageFlags } from "discord.js";
type CooldownScope = "guild" | "global";
type CooldownKey = `${string}:${string}:${string}`;
export const COOLDOWNS = new Map<CooldownKey, number>();
export function isOnCooldown(
	userId: string,
	commandName: string,
	cooldownMs: number,
	scope: CooldownScope,
	guildId?: string
): { onCooldown: true; retryAfter: number } | { onCooldown: false } {
	const id = scope === "guild" ? guildId ?? "global" : userId;
	const key: CooldownKey = `${scope}:${id}:${commandName}`;
	const now = Date.now();
	const expiresAt = COOLDOWNS.get(key);
	if (expiresAt && now < expiresAt) {
		return {
			onCooldown: true,
			retryAfter: expiresAt - now,
		};
	} else {
		COOLDOWNS.set(key, now + cooldownMs);
		return { onCooldown: false };
	}
}

export default async function ({ interaction, commandObj }: ValidationProps) {
	if (!interaction.isChatInputCommand()) return false;
	const cooldown = commandObj.options?.cooldown ?? 5000;
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
