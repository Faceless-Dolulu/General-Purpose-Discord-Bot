import { MessageComponentInteraction, MessageFlags } from "discord.js";
import { KickSettings } from "../../../classes/kick-settings.js";
import { commandSettingsCache } from "../../../util/command-settings-cache.js";
import kickCommandSettings from "../../../models/kick-command-settings.js";
import { initialModerationSettingsMenu } from "./initial-menu.js";
import { openSettingsMenuCache } from "../../../util/settings-menu-open.js";

export async function kickSettingsMenu(
	interaction: MessageComponentInteraction
): Promise<void> {
	let config: KickSettings;
	if (commandSettingsCache.has(`${interaction.guildId}:kick`)) {
		config = commandSettingsCache.get<KickSettings>(
			`${interaction.guildId}:kick`
		) as KickSettings;
	} else {
		config = await kickCommandSettings.findOneAndUpdate(
			{
				guildId: interaction.guildId,
			},
			{
				$setOnInsert: { guildId: interaction.guildId },
			},
			{ upsert: true, new: true }
		);
	}

	const settings = new KickSettings(
		config.guildId,
		config.enabled,
		config.reasonRequired,
		config.evidenceRequired,
		config.logChannelId
	);

	const container = await settings.createSettingsContainer(config, {
		saved: false,
		disabled: false,
	});
	const initialResponse = await interaction.update({
		components: [container],
		flags: MessageFlags.IsComponentsV2,
	});
	const collector = initialResponse.createMessageComponentCollector({
		filter: (i) => i.user.id === interaction.user.id,
		time: 180_000,
	});

	collector.on(`collect`, async (i) => {
		async function updateMenu(
			config: KickSettings,
			newSettings: KickSettings,
			saved: boolean,
			cancelled?: boolean
		) {
			const container = await newSettings.createSettingsContainer(config, {
				saved: saved,
				disabled: cancelled ?? false,
			});

			if (i.deferred) {
				return await i.editReply({
					components: [container],
					flags: MessageFlags.IsComponentsV2,
				});
			} else {
				return await i.update({
					components: [container],
					flags: MessageFlags.IsComponentsV2,
				});
			}
		}

		if (i.isButton()) {
			switch (i.customId) {
				case "toggle_enabled_state":
					collector.resetTimer();
					settings.enabled = !settings.enabled;
					return await updateMenu(config, settings, false);
				case "toggle_reason_required":
					collector.resetTimer();
					settings.reasonRequired = !settings.reasonRequired;
					return await updateMenu(config, settings, false);
				case "toggle_evidence_required":
					collector.resetTimer();
					settings.evidenceRequired = !settings.evidenceRequired;
					return await updateMenu(config, settings, false);
				case "cancel":
					collector.stop(`process_cancelled`);
					openSettingsMenuCache.delete(i.guildId as string);
					await updateMenu(config, settings, false, true);
					return i.followUp({
						content: `ℹ️ Process cancelled. Any unsaved changes have been lost.`,
						flags: MessageFlags.Ephemeral,
					});
				case "save_changes":
					collector.resetTimer();
					await i.deferUpdate();
					try {
						await settings.saveToDatabase();
						commandSettingsCache.set(`${interaction.guildId}:kick`, settings);
						return await updateMenu(config, settings, true, false);
					} catch (error) {
						await updateMenu(config, settings, false);
						return i.followUp({
							content: `⚠️ An error occurred while saving to the database. Please try again.\nIf the error persists, please make a ticket in the support server.`,
							flags: MessageFlags.Ephemeral,
						});
					}
				case "not_finished":
				case "prev_page":
					collector.stop();
					return initialModerationSettingsMenu(i);
				case "finished":
					collector.stop(`process_finished`);
					openSettingsMenuCache.delete(i.guildId as string);
					await updateMenu(config, settings, true, true);
					return i.followUp({
						content: `ℹ️ Process marked as finished. This menu is now locked.`,
						flags: MessageFlags.Ephemeral,
					});

				default:
					await i.deferUpdate();
					await updateMenu(config, settings, false);
					return await i.followUp({
						content: `⚠️ Unexpected error. You should not be seeing this message. Make a bug report in the support server.`,
						flags: MessageFlags.Ephemeral,
					});
			}
		} else if (i.isChannelSelectMenu()) {
			switch (i.customId) {
				case "set_log_channel":
					collector.resetTimer();
					settings.logChannelId = i.values[0];
					return await updateMenu(config, settings, false);
			}
		} else {
			await updateMenu(config, settings, false);
			return await i.followUp({
				content: `⚠️ Unknown input. You should not be seeing this. Please make a bug report in the support server.`,
				flags: MessageFlags.Ephemeral,
			});
		}
	});
}
