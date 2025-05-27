import { MessageComponentInteraction } from "discord.js";

export const moderationMenuHandlers: Record<
	string,
	(interaction: MessageComponentInteraction) => Promise<void>
> = {};
