import {
	ActionRowBuilder,
	ButtonBuilder,
	ChannelSelectMenuBuilder,
	ChannelType,
	ContainerBuilder,
	SeparatorBuilder,
	SeparatorSpacingSize,
	TextDisplayBuilder,
} from "discord.js";
import { createButton } from "../util/button-builder.js";
import { createSelectMenu } from "../util/select-menu-builder.js";
import prettyMilliseconds from "pretty-ms";
import { ModerationSettings } from "./command-settings.js";
import { UpdateWriteOpResult } from "mongoose";
import timeoutCommandSettings from "../models/timeout-command-settings.js";

export class TimeoutSettings extends ModerationSettings {
	private _defaultDuration: number;
	constructor(
		guildId: string,
		enabled: boolean,
		reasonRequired: boolean,
		evidenceRequired: boolean,
		defaultDuration: number,
		logChannelId: string | null
	) {
		super(guildId, enabled, reasonRequired, evidenceRequired, logChannelId);
		this._defaultDuration = defaultDuration;
	}
	set defaultDuration(value: number) {
		this._defaultDuration = value;
	}

	get defaultDuration(): number {
		return this._defaultDuration;
	}
	override getActionKey(): string {
		return "timeout";
	}
	protected override hasChanges(config: TimeoutSettings): boolean {
		if (
			this.enabled !== config.enabled ||
			this.reasonRequired !== config.reasonRequired ||
			this.evidenceRequired !== config.evidenceRequired ||
			this.logChannelId !== config.logChannelId ||
			this.defaultDuration !== config.defaultDuration
		) {
			return true;
		} else return false;
	}

	/**
	 *
	 * Saves The timeout command settings to the database
	 */
	override async saveToDatabase(): Promise<UpdateWriteOpResult> {
		return await timeoutCommandSettings.updateOne(
			{
				guildId: this._guildId,
			},
			{
				$set: {
					enabled: this._enabled,
					reasonRequired: this._reasonRequired,
					evidenceRequired: this._evidenceRequired,
					logChannelId: this._logChannelId,
					defaultTimeoutDuration: this._defaultDuration,
				},
			},
			{ new: true }
		);
	}

	/** Creates an auto-populated settings menu for the timeout moderation command
	 *
	 * @param config The config as currently saved in the database
	 * @param properties Additonal properties regarding state control (i.e., whether changes have been saved or not)
	 * @returns a containerBuilder object to be used inside a interaction reply/update/etc. components properties.
	 */
	override async createSettingsContainer(
		config: TimeoutSettings,
		properties: {
			saved: boolean; // Whether changes have been saved to database or not
			disabled: boolean; // Whether interactables should be disabled or not
		}
	): Promise<ContainerBuilder> {
		const container = await super.createSettingsContainer(config, properties);

		let settingsDisplaySection = container.components[0] as TextDisplayBuilder;
		const settingsDisplay: string[] =
			settingsDisplaySection.data.content?.split(`\n\n`) ?? [];

		let title: string;
		if (properties?.saved === true) {
			title = `## Timeout Command Configuration (Changes Saved)` as string;
		} else if (this.hasChanges(config) === true) {
			title = `## Timeout Command Configuration (Changes Unsaved)` as string;
		} else {
			title = `## Timeout Command Configuration` as string;
		}
		settingsDisplay.unshift(title);

		const duration = prettyMilliseconds(this.defaultDuration, {
			verbose: true,
		});
		if (this.defaultDuration !== config.defaultDuration) {
			settingsDisplay.push(`✨ **Default Duration:** ${duration}` as string);
		} else {
			settingsDisplay.push(`**Default Duration:** ${duration}` as string);
		}

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
					placeholder: `Select a log channel for timeout actions`,
					defaultValues: config.logChannelId ? [config.logChannelId] : [],
				}) as ChannelSelectMenuBuilder
			)
		);

		const [
			enabledButton,
			reasonRequiredButton,
			evidenceRequiredButton,
			setDefaultDurationButton,
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
				customId: `set_default_duration`,
				label: `Set Default Duration`,
				emoji: "🛠️",
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
				setDefaultDurationButton,
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
