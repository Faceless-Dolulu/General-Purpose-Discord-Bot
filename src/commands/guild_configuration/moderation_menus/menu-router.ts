import { MessageComponentInteraction } from "discord.js";
import { timeoutSettingsMenu } from "./timeout-settings-menu.js";
import { muteSettingsMenu } from "./mute-settings-menu.js";
import { kickSettingsMenu } from "./kick-settings-menu.js";
import { banSettingsMenu } from "./ban-settings-menu.js";

export const moderationMenuHandlers: Record<
	string,
	(interaction: MessageComponentInteraction) => Promise<void>
> = {
	"timeout-command": timeoutSettingsMenu,
	"mute-command": muteSettingsMenu,
	"kick-command": kickSettingsMenu,
	"ban-command": banSettingsMenu,
};
