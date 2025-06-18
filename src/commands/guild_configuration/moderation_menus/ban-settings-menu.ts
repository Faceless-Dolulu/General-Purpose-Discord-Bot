import { MessageComponentInteraction, MessageFlags } from "discord.js";
import { BanSettings } from "../../../classes/ban-settings.js";
import { commandSettingsCache } from "../../../util/command-settings-cache.js";
import banCommandSettings from "../../../models/ban-command-settings.js";
import { openSettingsMenuCache } from "../../../util/settings-menu-open.js";
import { initialModerationSettingsMenu } from "./initial-menu.js";

export async function banSettingsMenu(
	interaction: MessageComponentInteraction
): Promise<void> {
	let config: BanSettings;
	if (commandSettingsCache.has(`${interaction.guildId}:ban`)) {
		config = commandSettingsCache.get<BanSettings>(
			`${interaction.guildId}:ban`
		) as BanSettings;
	} else {
		config = await banCommandSettings.findOneAndUpdate(
			{
				guildId: interaction.guildId,
			},
			{
				$setOnInsert: { guildId: interaction.guildId },
			},
			{ upsert: true, new: true }
		);
	}

	const settings = new BanSettings(
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
			config: BanSettings,
			newSettings: BanSettings,
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
						commandSettingsCache.set(`${interaction.guildId}:ban`, settings);
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

	collector.on(`end`, async () => {
		switch (collector.endReason) {
			case "time":
				await interaction.editReply({
					components: [
						await settings.createSettingsContainer(config, {
							saved: false,
							disabled: true,
						}),
					],
				});
				return await interaction.followUp({
					content: `ℹ️ Menu timed out. Any unsaved changes have been lost.`,
					flags: MessageFlags.Ephemeral,
				});
			case "process_finished":
				return openSettingsMenuCache.delete(interaction.guildId as string);
			case "return_to_prev_menu":
				return;
			default:
				return await interaction.followUp({
					content: `⚠️ You should not be seeing this message. Please make a bug report in the support server.`,
					flags: MessageFlags.Ephemeral,
				});
		}
	});

	collector.on(`ignore`, async (i) => {
		await i.reply({
			content: `❌ This menu is not for you.`,
			flags: MessageFlags.Ephemeral,
		});
	});
}
