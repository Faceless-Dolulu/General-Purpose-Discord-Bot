import {
	ActionRowBuilder,
	ButtonBuilder,
	ChannelSelectMenuBuilder,
	ChannelType,
	ContainerBuilder,
	roleMention,
	RoleSelectMenuBuilder,
	SeparatorBuilder,
	SeparatorSpacingSize,
	Snowflake,
	TextDisplayBuilder,
} from "discord.js";
import { ModerationSettings } from "./command-settings.js";
import { UpdateWriteOpResult } from "mongoose";
import muteCommandSettings from "../models/mute-command-settings.js";
import prettyMilliseconds from "pretty-ms";
import { createSelectMenu } from "../util/select-menu-builder.js";
import { createButton } from "../util/button-builder.js";
import { client } from "../index.js";

export class MuteSettings extends ModerationSettings {
	private _defaultDuration: number;
	private _muteRoleId: Snowflake | null;
	constructor(
		guildId: Snowflake,
		enabled: boolean,
		reasonRequired: boolean,
		evidenceRequired: boolean,
		defaultDuration: number,
		logChannelId: Snowflake | null,
		muteRoleId: Snowflake | null
	) {
		super(guildId, enabled, reasonRequired, evidenceRequired, logChannelId);
		this._defaultDuration = defaultDuration;
		this._muteRoleId = muteRoleId ?? null;
	}

	set defaultDuration(value: number) {
		this._defaultDuration = value;
	}
	get defaultDuration(): number {
		return this._defaultDuration;
	}

	set muteRoleId(value: Snowflake) {
		this._muteRoleId = value;
	}
	get muteRoleId(): Snowflake | null {
		return this._muteRoleId;
	}

	override getActionKey(): string {
		return "mute";
	}

	protected override hasChanges(config: MuteSettings): boolean {
		if (
			this.enabled !== config.enabled ||
			this.reasonRequired !== config.reasonRequired ||
			this.evidenceRequired !== config.evidenceRequired ||
			this.logChannelId !== config.logChannelId ||
			this.defaultDuration !== config.defaultDuration ||
			this.muteRoleId !== config.muteRoleId
		) {
			return true;
		} else return false;
	}

	/**
	 * Saves the mute command settings to the database
	 */
	override async saveToDatabase(): Promise<UpdateWriteOpResult> {
		return await muteCommandSettings.updateOne(
			{
				guildId: this.guildId,
			},
			{
				$set: {
					enabled: this.enabled,
					reasonRequired: this.reasonRequired,
					evidenceRequired: this.evidenceRequired,
					logChannelId: this.logChannelId,
					defaultDuration: this.defaultDuration,
					muteRoleId: this.muteRoleId,
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
		config: MuteSettings,
		properties: { saved: boolean; disabled: boolean }
	): Promise<ContainerBuilder> {
		const container = await super.createSettingsContainer(config, properties);

		let settingsDisplaySection = container.components[0] as TextDisplayBuilder;
		const settingsDisplay: string[] =
			settingsDisplaySection.data.content?.split(`\n\n`) ?? [];
		let title: string;
		if (properties.saved === true) {
			title = `## Mute Command Configuration (Changes Saved)` as string;
		} else if (this.hasChanges(config) === true) {
			title = `## Mute Command Configuration (Changes Unsaved)` as string;
		} else {
			title = `## Mute Command Configuration` as string;
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

		const roleExists =
			(await (await client.guilds.fetch(this.guildId)).roles.fetch()).filter(
				(role) => role.id === this.muteRoleId
			).size === 1
				? true
				: false;
		if (this.muteRoleId !== null && roleExists) {
			if (this.muteRoleId !== config.muteRoleId) {
				settingsDisplay.push(
					`✨ **Mute Role:** ${roleMention(this.muteRoleId)}`
				);
			} else {
				settingsDisplay.push(`**Mute Role:** ${roleMention(this.muteRoleId)}`);
			}
		} else if (this.muteRoleId === null) {
			settingsDisplay.push(
				`**Mute Role:** *No role has been assigned. Please assign a role in order to enable this command.*`
			);
		} else if (!roleExists && this.muteRoleId !== null) {
			settingsDisplay.push(
				`**Mute Role:** *Previously assigned role no longer exists. Please assign a role in order to enable this command again.*`
			);
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
					placeholder: `Select a log channel for mute actions`,
					defaultValues: config.logChannelId ? [config.logChannelId] : [],
				}) as ChannelSelectMenuBuilder
			)
		);

		container.addActionRowComponents(
			new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(
				createSelectMenu({
					type: "role",
					customId: `set_mute_role`,
					disabled:
						properties.disabled === true || properties.saved === true
							? true
							: false,
					maxValues: 1,
					minValues: 1,
					placeholder: `Select the new role to give on mute`,
				}) as RoleSelectMenuBuilder
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
					properties?.disabled === true ||
					properties?.saved === true ||
					this.muteRoleId === null
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
