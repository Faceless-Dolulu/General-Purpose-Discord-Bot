export type CooldownScope = `guild` | `global`;
export type CooldownKey =
	| `${CooldownScope}:${string}:${string}`
	| `${CooldownScope}:${string}:${string}:${string}`;
export const cooldownCache = new Map<CooldownKey, number>();

export function isOnCooldown(
	userId: string,
	commandName: string,
	cooldownInMs: number,
	scope: CooldownScope,
	guildId?: string
): { onCooldown: true; retryAfter: number } | { onCooldown: false } {
	let key: CooldownKey;
	if (scope === "guild") {
		key = `${scope}:${guildId}:${userId}:${commandName}`;
	} else {
		key = `${scope}:${userId}:${commandName}`;
	}

	const now = Date.now();

	const expiresAt = cooldownCache.get(key);
	if (expiresAt && now < expiresAt) {
		return { onCooldown: true, retryAfter: expiresAt - now };
	}

	cooldownCache.set(key, now + cooldownInMs);
	return { onCooldown: false };
}
