import { MessageComponentInteraction } from "discord.js";
import { timeoutSettingsMenu } from "./timeout-settings-menu.js";

export const moderationMenuHandlers: Record<
	string,
	(interaction: MessageComponentInteraction) => Promise<void>
> = {
	"timeout-command": timeoutSettingsMenu,
};
