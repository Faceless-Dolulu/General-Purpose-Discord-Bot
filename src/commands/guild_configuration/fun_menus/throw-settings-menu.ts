import {
	MessageComponentInteraction,
	MessageFlags,
	TextChannel,
} from "discord.js";
import ThrowConfig from "../../../models/throw-command-settings.js";
import { ThrowSettings } from "../../../classes/command-settings.js";
import { initialFunSettingsMenu } from "./initial-menu.js";
import { normalizeTimeUnit } from "../../../functions/normalize-time-units.js";
import ms from "ms";
import { openSettingsMenuCache } from "../../../util/settings-menu-open.js";

export async function throwSettingsMenu(
	interaction: MessageComponentInteraction
): Promise<void> {
	const config = await ThrowConfig.findOneAndUpdate(
		{
			guildId: interaction.guildId,
		},
		{ $setOnInsert: { guildId: interaction.guildId } },
		{ upsert: true, new: true }
	);

	const cloneableConfig = config.toJSON();

	const settings = new ThrowSettings(
		cloneableConfig.guildId,
		cloneableConfig.enabled,
		cloneableConfig.cooldown,
		cloneableConfig.customItems,
		cloneableConfig.customItemsOnly
	);

	const container = await settings.createSettingsContainer(
		config,
		false,
		false
	);
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
			config: ThrowSettings,
			newSettings: ThrowSettings,
			saved: boolean,
			cancelled?: boolean
		) {
			const container = await newSettings.createSettingsContainer(
				config,
				saved,
				cancelled ?? false
			);

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
				case "set_cooldown":
					await i.deferUpdate();
					const setCooldownPrompt = await (i.channel as TextChannel).send({
						content: `Send a message containing the duration you'd like to set as default. (Format ex. 5s, 3m)`,
					});
					const cooldownCollector = (
						i.channel as TextChannel
					).createMessageCollector({
						filter: (m) => m.author.id === interaction.user.id,
						time: 120_000,
					});
					cooldownCollector.on(`collect`, async (m) => {
						const matches = m.content.matchAll(
							/^((\d+)\s*(minutes|minute|min|m|seconds|second|sec|s)\s*)+$/g
						);
						const seenUnits = new Set<string>();
						let totalDuration = 0 as number;
						for (const match of matches) {
							const rawUnit = match[3].toLowerCase();
							const normalizedUnit = normalizeTimeUnit(rawUnit);
							if (!normalizedUnit)
								return interaction.followUp({
									content: `⚠️ Invalid time unit detected.\n\nValid units: \`s\`, \`m\``,
									flags: MessageFlags.Ephemeral,
								});
							if (seenUnits.has(normalizedUnit as string)) {
								return interaction.followUp({
									content: `⚠️ You've specified the ${
										"`" + normalizedUnit + "`"
									} unit multiple times. Please use each time unit only once.`,
									flags: MessageFlags.Ephemeral,
								});
							}

							seenUnits.add(normalizedUnit as string);
							const duration = ms(match[2] + normalizedUnit);
							totalDuration = totalDuration + duration;
						}
						settings.cooldown = totalDuration;
						await (interaction.channel as TextChannel).bulkDelete([
							m.id,
							setCooldownPrompt.id,
						]);
						cooldownCollector.stop();
						return await updateMenu(config, settings, false, false);
					});
					break;
				case "remove_cooldown":
					settings.cooldown = null;
					return updateMenu(config, settings, false, false);
				case "toggle_custom_items_only":
					collector.resetTimer();
					settings.customItemsOnly = !settings.customItemsOnly;
					return await updateMenu(config, settings, false);
				case "preview_full_item_list":
					collector.resetTimer();
					const itemListContainer = settings.createFullItemListContainer();

					return await i.reply({
						components: [itemListContainer],
						flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral],
					});
				case "add_custom_items":
					await i.deferUpdate();
					collector.resetTimer();
					const addPrompt = await (i.channel as TextChannel).send({
						content: `Please send a message containing a list of custom items you'd like to add to the list separated by a coma (', ')`,
					});

					const itemAdditionCollector = (
						i.channel as TextChannel
					).createMessageCollector({
						filter: (m) => m.author.id === i.user.id,
						time: 120_000,
					});

					itemAdditionCollector.on(`collect`, async (m) => {
						const rawInput = m.content;
						let { validItems, summaryMessage } =
							settings.validateNewThrowItems(rawInput);
						const duplicatedItems = validItems.filter((item) =>
							config.customItems.includes(item)
						);
						validItems = validItems.filter(
							(item) => !config.customItems.includes(item)
						);
						if (duplicatedItems.length >= 1) {
							summaryMessage += `\n${duplicatedItems.length} item(s) were already in the list and were skipped`;
						}

						settings.addCustomItems(validItems);
						await i.followUp({
							content: summaryMessage,
							flags: MessageFlags.Ephemeral,
						});

						await (interaction.channel as TextChannel).bulkDelete([
							m.id,
							addPrompt.id,
						]);
						itemAdditionCollector.stop();
						return await updateMenu(config, settings, false, false);
					});
					return;
				case "remove_custom_items":
					await i.deferUpdate();
					const removePrompt = await (i.channel as TextChannel).send({
						content: `Please send a message containing a list of custom items you'd like to remove from the list separated by a comma (', ')`,
					});
					const itemRemovalCollector = (
						i.channel as TextChannel
					).createMessageCollector({
						filter: (m) => m.author.id === interaction.user.id,
						time: 120_000,
					});
					itemRemovalCollector.on(`collect`, async (m) => {
						const rawInput = m.content;
						let { itemsToRemove, summaryMessage } =
							settings.validateRemovedThrowItems(rawInput);

						settings.removeCustomItems(itemsToRemove);
						if (settings.customItems.length < 30) {
							settings.customItemsOnly = false;
						}
						await interaction.followUp({
							content: summaryMessage,
							flags: MessageFlags.Ephemeral,
						});
						await (interaction.channel as TextChannel).bulkDelete([
							m.id,
							removePrompt.id,
						]);
						itemRemovalCollector.stop();
						return await updateMenu(config, settings, false, false);
					});
					return;
				case "prev_page":
					collector.stop();
					return initialFunSettingsMenu(i);
				case "cancel":
					collector.stop(`process_cancelled`);
					openSettingsMenuCache.delete(i.guildId as string);
					return await updateMenu(config, settings, false, true);
				case "finished":
					collector.stop(`process_finished`);
					openSettingsMenuCache.delete(i.guildId as string);
					return await updateMenu(config, settings, true, true);
				case "save_changes":
					try {
						await settings.saveToDatabase();
					} catch (error) {
						return await i.reply({
							content: `⚠️ An error has occurred. Please try again.`,
							flags: MessageFlags.Ephemeral,
						});
					}

					return await updateMenu(config, settings, true, false);
				default:
					return await i.reply({
						content: `⛔ You should not be seeing this message. Please make a bug report in the support server with steps on how to reproduce.`,
						flags: MessageFlags.Ephemeral,
					});
			}
		} else {
			return;
		}
	});
}
