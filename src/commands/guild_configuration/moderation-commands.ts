import { Interaction, SlashCommandSubcommandBuilder } from "discord.js";
import { initialModerationSettingsMenu } from "./moderation_menus/initial-menu.js";

export default {
	data: new SlashCommandSubcommandBuilder(),
	run: async <T extends Interaction>(interaction: T) => {
		return initialModerationSettingsMenu(interaction);
	},
};
