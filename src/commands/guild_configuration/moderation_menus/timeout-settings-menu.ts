import {
	MessageComponentInteraction,
	MessageFlags,
	TextChannel,
} from "discord.js";
import timeoutCommandSettings from "../../../models/timeout-command-settings.js";
import { TimeoutSettings } from "../../../classes/timeout-settings.js";
import { normalizeTimeUnit } from "../../../functions/normalize-time-units.js";
import ms from "ms";
import { initialModerationSettingsMenu } from "./initial-menu.js";
import { openSettingsMenuCache } from "../../../util/settings-menu-open.js";
import { commandSettingsCache } from "../../../util/command-settings-cache.js";

export async function timeoutSettingsMenu(
	interaction: MessageComponentInteraction
): Promise<void> {
	let config: TimeoutSettings;

	if (commandSettingsCache.has(`${interaction.guildId}:timeout`)) {
		config = commandSettingsCache.get<TimeoutSettings>(
			`${interaction.guildId}:timeout`
		) as TimeoutSettings;
	} else {
		config = await timeoutCommandSettings.findOneAndUpdate(
			{
				guildId: interaction.guildId,
			},
			{ $setOnInsert: { guildId: interaction.guildId } },
			{ upsert: true, new: true }
		);
	}

	const settings = new TimeoutSettings(
		config.guildId,
		config.enabled,
		config.reasonRequired,
		config.evidenceRequired,
		config.defaultDuration,
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

	collector.on("collect", async (i) => {
		async function updateMenu(
			config: TimeoutSettings,
			newSettings: TimeoutSettings,
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
						content: `Send a message containing the duration you'd like to set as default. (Format ex. 30m, 2h)`,
					});
					const defaultDurationCollector = (
						i.channel as TextChannel
					).createMessageCollector({
						filter: (m) => m.author.id === interaction.user.id,
						time: 120_000,
					});

					defaultDurationCollector.on("collect", async (m) => {
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
									content: `⚠️ Invalid time unit detected.\n\nValid units: \`s\`, \`m\`, \`h\`, \`d\``,
									flags: MessageFlags.Ephemeral,
								});
							}
							if (seenUnits.has(normalizedUnit)) {
								await m.delete();
								return await interaction.followUp({
									content: `⚠️ You've specified the \`${normalizedUnit}\` unit multiple times. Please use each time unit only once.`,
									flags: MessageFlags.Ephemeral,
								});
							}
							seenUnits.add(normalizedUnit);
							const duration = ms(match[2] + normalizedUnit);
							totalDuration += duration;
							if (totalDuration > ms(`28 Days`)) {
								return await interaction.followUp({
									content: `⚠️ Default timeout duration exceeds Discord's 28 day limit. Consider configuring the \`/mute\` command`,
									flags: MessageFlags.Ephemeral,
								});
							}
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
						commandSettingsCache.set(
							`${interaction.guildId}:timeout`,
							settings
						);
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
