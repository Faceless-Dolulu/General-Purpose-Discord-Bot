import { MessageComponentInteraction } from "discord.js";
import { throwSettingsMenu } from "./throw-settings-menu.js";

export const funMenuHandlers: Record<
	string,
	(interaction: MessageComponentInteraction) => Promise<void>
> = {
	"throw-command": throwSettingsMenu,
};
