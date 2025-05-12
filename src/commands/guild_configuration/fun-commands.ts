import { Interaction, SlashCommandSubcommandBuilder } from "discord.js";
import { initialFunSettingsMenu } from "./fun_menus/initial-menu.js";

export default {
	data: new SlashCommandSubcommandBuilder(),
	run: async <T extends Interaction>(interaction: T) => {
		return initialFunSettingsMenu(interaction);
	},
};
