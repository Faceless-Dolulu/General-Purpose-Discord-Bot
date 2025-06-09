import NodeCache from "node-cache";
import { clearTimeout } from "timers";

export type CommandSettingsKey = `${string}:${string}`;

export const commandSettingsCache = new NodeCache({
	stdTTL: 60,
	checkperiod: 60,
	useClones: true,
});
let expiredWaveCount = 0;
let expiredWaveTimer: NodeJS.Timeout | null = null;

commandSettingsCache.on("expired", () => {
	expiredWaveCount++;

	if (expiredWaveTimer) clearTimeout(expiredWaveTimer);

	expiredWaveTimer = setTimeout(() => {
		console.info(
			`\x1b[36m[GC]\x1b[0m ${expiredWaveCount} command config(s) have been cleared from the cache.`
		);
		expiredWaveCount = 0;
	}, 1000);
});
