import NodeCache from "node-cache";

export type CommandSettingsKey = `${string}:${string}`;

export const commandSettingsCache = new NodeCache({
	stdTTL: 300,
	checkperiod: 60,
	useClones: false,
});
