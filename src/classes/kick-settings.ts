import {
	ActionRowBuilder,
	ButtonBuilder,
	ChannelSelectMenuBuilder,
	ChannelType,
	ContainerBuilder,
	SeparatorBuilder,
	SeparatorSpacingSize,
	Snowflake,
	TextDisplayBuilder,
} from "discord.js";
import { ModerationSettings } from "./command-settings.js";
import { UpdateWriteOpResult } from "mongoose";
import kickCommandSettings from "../models/kick-command-settings.js";
import { createSelectMenu } from "../util/select-menu-builder.js";
import { createButton } from "../util/button-builder.js";

export class KickSettings extends ModerationSettings {
	constructor(
		guildId: Snowflake,
		enabled: boolean,
		reasonRequired: boolean,
		evidenceRequired: boolean,
		logChannelId: Snowflake | null
	) {
		super(guildId, enabled, reasonRequired, evidenceRequired, logChannelId);
	}

	override getActionKey(): string {
		return "kick";
	}

	protected override hasChanges(config: KickSettings): boolean {
		if (
			this.enabled !== config.enabled ||
			this.reasonRequired !== config.reasonRequired ||
			this.evidenceRequired !== config.evidenceRequired ||
			this.logChannelId !== config.logChannelId
		) {
			return true;
		} else return false;
	}

	/**
	 *  Saves the kick command settings to the database
	 */
	override async saveToDatabase(): Promise<UpdateWriteOpResult> {
		return await kickCommandSettings.updateOne(
			{
				guildId: this.guildId,
			},
			{
				$set: {
					enabled: this.enabled,
					reasonRequired: this.reasonRequired,
					evidenceRequired: this.evidenceRequired,
					logChannelId: this.logChannelId,
				},
			},
			{ new: true }
		);
	}

	/** Creates an auto-populated settings menu for the mute moderation command
	 *
	 * @param config The config as currently saved in the database
	 * @param properties Additional properties regarding state control (i.e., whether changes have been saved or not)
	 * @returns containerBuilder object to be used inside an interaction reply/update/etc. component properties.
	 */
	override async createSettingsContainer(
		config: KickSettings,
		properties: { saved: boolean; disabled: boolean }
	): Promise<ContainerBuilder> {
		const container = await super.createSettingsContainer(config, properties);

		let settingsDisplaySection = container.components[0] as TextDisplayBuilder;
		const settingsDisplay: string[] =
			settingsDisplaySection.data.content?.split(`\n\n`) ?? [];
		let title: string;
		if (properties.saved === true) {
			title = `## Kick Command Configuration (Changes Saved)` as string;
		} else if (this.hasChanges(config) === true) {
			title = `## Kick Command Configuration (Changes Unsaved)` as string;
		} else {
			title = `## Kick Command Configuration` as string;
		}
		settingsDisplay.unshift(title);

		settingsDisplaySection.setContent(settingsDisplay.join("\n\n") as string);

		container.spliceComponents(0, 1, settingsDisplaySection);

		container.addActionRowComponents(
			new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
				createSelectMenu({
					type: "channel",
					customId: `set_log_channel`,
					disabled:
						properties?.disabled === true || properties?.saved === true
							? true
							: false,
					maxValues: 1,
					minValues: 0,
					channelTypes: ChannelType.GuildText,
					placeholder: `Select a log channel for kick actions`,
					defaultValues: config.logChannelId ? [config.logChannelId] : [],
				}) as ChannelSelectMenuBuilder
			)
		);

		const [
			enabledButton,
			reasonRequiredButton,
			evidenceRequiredButton,
			cancelButton,
			saveChangesButton,
			prevPageButton,
		] = [
			createButton({
				style: "secondary",
				customId: `toggle_enabled_state`,
				label: `Toggle Enabled Status`,
				emoji: "🔁",
				disabled:
					properties?.disabled === true || properties?.saved === true
						? true
						: false,
			}),
			createButton({
				style: "secondary",
				customId: `toggle_reason_required`,
				label: `Toggle Reason Required`,
				emoji: "🔁",
				disabled:
					properties?.disabled === true || properties?.saved === true
						? true
						: false,
			}),
			createButton({
				style: "secondary",
				customId: `toggle_evidence_required`,
				label: `Toggle Evidence Required`,
				emoji: "🔁",
				disabled:
					properties?.disabled === true || properties?.saved === true
						? true
						: false,
			}),
			createButton({
				style: "secondary",
				customId: `cancel`,
				label: `Cancel`,
				disabled: properties?.disabled === true ? true : false,
				emoji: "❌",
			}),
			createButton({
				style: "success",
				customId: `save_changes`,
				label: `Save Changes`,
				disabled:
					properties?.disabled === true
						? true
						: this.hasChanges(config) === true
						? false
						: true,
				emoji: "💾",
			}),
			createButton({
				style: "primary",
				customId: `prev_page`,
				label: `Go Back`,
				emoji: "↩️",
				disabled: properties?.disabled === true ? true : false,
			}),
		];

		const configurationButtons =
			new ActionRowBuilder<ButtonBuilder>().addComponents([
				enabledButton,
				reasonRequiredButton,
				evidenceRequiredButton,
			]);
		const navigationButtons =
			new ActionRowBuilder<ButtonBuilder>().addComponents([
				prevPageButton,
				cancelButton,
				saveChangesButton,
			]);
		container
			.addActionRowComponents(configurationButtons)
			.addSeparatorComponents(
				new SeparatorBuilder()
					.setDivider(true)
					.setSpacing(SeparatorSpacingSize.Large)
			);
		if (properties?.saved === false) {
			container.addActionRowComponents(navigationButtons);
		} else if (properties?.saved === true) {
			const [finishedButton, notFinishedButton] = [
				createButton({
					style: `secondary`,
					label: `No, I'm done here`,
					emoji: `❌`,
					customId: `finished`,
					disabled: properties?.disabled === true ? true : false,
				}),
				createButton({
					style: `secondary`,
					label: `Yes, I want to configure other settings`,
					emoji: `✅`,
					customId: `not_finished`,
					disabled: properties?.disabled === true ? true : false,
				}),
			];
			container.addActionRowComponents(
				new ActionRowBuilder<ButtonBuilder>().addComponents(
					notFinishedButton,
					finishedButton
				)
			);
		}
		return container;
	}
}
