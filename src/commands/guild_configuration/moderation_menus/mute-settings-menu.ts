import {
	MessageComponentInteraction,
	MessageFlags,
	TextChannel,
} from "discord.js";
import { MuteSettings } from "../../../classes/mute-settings.js";
import { commandSettingsCache } from "../../../util/command-settings-cache.js";
import muteCommandSettings from "../../../models/mute-command-settings.js";
import { normalizeTimeUnit } from "../../../functions/normalize-time-units.js";
import ms from "ms";
import { initialModerationSettingsMenu } from "./initial-menu.js";
import { openSettingsMenuCache } from "../../../util/settings-menu-open.js";

export async function muteSettingsMenu(
	interaction: MessageComponentInteraction
): Promise<void> {
	let config: MuteSettings;

	if (commandSettingsCache.has(`${interaction.guildId}:mute`)) {
		config = commandSettingsCache.get<MuteSettings>(
			`${interaction.guildId}:mute`
		) as MuteSettings;
	} else {
		config = await muteCommandSettings.findOneAndUpdate(
			{
				guildId: interaction.guildId,
			},
			{ $setOnInsert: { guildId: interaction.guildId } },
			{ upsert: true, new: true }
		);
	}

	const settings = new MuteSettings(
		config.guildId,
		config.enabled,
		config.reasonRequired,
		config.evidenceRequired,
		config.defaultDuration,
		config.logChannelId,
		config.muteRoleId
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
			config: MuteSettings,
			newSettings: MuteSettings,
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
				case "set_default_duration":
					await i.deferUpdate();
					collector.resetTimer();
					const setDefaultDurationPrompt = await (
						i.channel as TextChannel
					).send({
						content: `Send a message containing the duration you'd like to set as default. (Format ex. 30m, 1h)`,
					});
					const defaultDurationCollector = (
						i.channel as TextChannel
					).createMessageCollector({
						filter: (m) => m.author.id === interaction.user.id,
						time: 120_000,
					});

					defaultDurationCollector.on(`collect`, async (m) => {
						collector.resetTimer();
						const matches = m.content.matchAll(
							/^((\d+)\s*(days|day|d|hours|hour|h|minutes|minute|min|m|seconds|second|sec|s)\s*)+$/g
						);
						const seenUnits = new Set<string>();
						let totalDuration: number = 0;
						for (const match of matches) {
							const rawUnit = match[3].toLowerCase();
							const normalizedUnit = normalizeTimeUnit(rawUnit);
							if (!normalizedUnit) {
								await m.delete();
								return await interaction.followUp({
									content: `⚠️ Invalid time usnit detected.\n\nValid units: \`s\`, \`m\`, \`h\`, \`d\``,
									flags: MessageFlags.Ephemeral,
								});
							}
							if (seenUnits.has(normalizedUnit)) {
								await m.delete();
								return await interaction.followUp({
									content: `⚠️ Duplicate time unit detected: \`${normalizedUnit}\`.\nPlease use each unit only once.`,
									flags: MessageFlags.Ephemeral,
								});
							}
							seenUnits.add(normalizedUnit);
							const duration = ms(match[2] + normalizedUnit);
							totalDuration += duration;
						}

						settings.defaultDuration = totalDuration;
						await (i.channel as TextChannel).bulkDelete([
							m.id,
							setDefaultDurationPrompt.id,
						]);
						defaultDurationCollector.stop();
						return await updateMenu(config, settings, false);
					});
					break;
				case "save_changes":
					collector.resetTimer();
					await i.deferUpdate();
					try {
						await settings.saveToDatabase();
						commandSettingsCache.set(`${interaction.guildId}:mute`, settings);
						return await updateMenu(config, settings, true);
					} catch (error) {
						await updateMenu(config, settings, false);
						return i.followUp({
							content: `⚠️ An error occurred while saving to the database. Please try again.\nif the error persists, please make a ticker in the support server.`,
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
						content: `ℹ️ Process marked as finished. this menu is now locked.`,
						flags: MessageFlags.Ephemeral,
					});
				case "cancel":
					collector.stop("process_cancelled");
					await updateMenu(config, settings, false, true);
					return i.followUp({
						content: `ℹ️ Process cancelled. Any insaved changes have been lost.`,
						flags: MessageFlags.Ephemeral,
					});
				default:
					await i.deferUpdate();
					await updateMenu(config, settings, false);
					return await i.followUp({
						content: `⚠️ Unexpected error. You should not be seeing this message. Please make a bug report in the support server.`,
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
		} else if (i.isRoleSelectMenu()) {
			switch (i.customId) {
				case "set_mute_role":
					collector.resetTimer();
					settings.muteRoleId = i.values[0];
					return await updateMenu(config, settings, false);
			}
		} else {
			await updateMenu(config, settings, false);
			return await i.followUp({
				content: `⚠️ Unknown input. You should not be seeing this message. Please make a bug report in the support server.`,
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
