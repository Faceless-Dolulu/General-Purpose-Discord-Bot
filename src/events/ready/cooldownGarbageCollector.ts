import { cooldownCache } from "../../util/command-on-cooldown.js";

const GARBAGE_COLLECTOR_INTERVAL_MS = 30_000; // ❗ DO NOT CHANGE UNLESS SCALING SHOWS ISSUES

export default async function () {
	setInterval(() => {
		const now = Date.now();
		let cleaned = 0;
		for (const [key, expiresAt] of cooldownCache.entries()) {
			if (expiresAt <= now) {
				cooldownCache.delete(key);
				cleaned++;
			}
		}
		if (cleaned > 0) {
			console.debug(
				`[Cooldown GC] Cleaned ${cleaned} expired cooldown entries`
			);
		}
	}, GARBAGE_COLLECTOR_INTERVAL_MS);
}
