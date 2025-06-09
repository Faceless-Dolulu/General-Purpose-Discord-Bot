import {
	ActionRowBuilder,
	ButtonStyle,
	ContainerBuilder,
	SeparatorSpacingSize,
	ButtonBuilder,
	MessageActionRowComponentBuilder,
	SectionBuilder,
	SeparatorBuilder,
	TextDisplayBuilder,
	channelMention,
	ChannelSelectMenuBuilder,
	ChannelType,
	Snowflake,
} from "discord.js";
import prettyMilliseconds from "pretty-ms";
import { arraysEqual } from "../util/arrays-equal.js";
import throwCommandSettings from "../models/throw-command-settings.js";
import { UpdateWriteOpResult } from "mongoose";
import timeoutCommandSetttings from "../models/timeout-command-settings.js";
import { createButton } from "../util/button-builder.js";
import { createSelectMenu } from "../util/select-menu-builder.js";

export abstract class CommandSettings {
	protected _guildId: string;
	constructor(guildId: string) {
		this._guildId = guildId;
	}

	get guildId(): string {
		return this._guildId;
	}
	protected abstract hasChanges(config: CommandSettings): boolean;
}

export abstract class FunSettings extends CommandSettings {
	protected _enabled: boolean;
	protected _cooldown: number | null;

	constructor(guildId: string, enabled: boolean, cooldown?: number | null) {
		super(guildId);
		this._enabled = enabled;
		this._cooldown = cooldown ?? null;
	}

	get enabled(): boolean {
		return this._enabled;
	}

	set enabled(value: boolean) {
		this._enabled = value;
	}

	set cooldown(value: number | null) {
		this._cooldown = value;
	}

	get cooldown(): number | null {
		return this._cooldown;
	}
}

export abstract class ModerationSettings extends CommandSettings {
	protected _enabled: boolean;
	protected _reasonRequired: boolean;
	protected _evidenceRequired: boolean;
	protected _logChannelId: string | null;

	constructor(
		guildId: string,
		enabled: boolean,
		reasonRequired: boolean,
		evidenceRequired: boolean,
		logChannelId: string | null
	) {
		super(guildId);
		this._enabled = enabled;
		this._reasonRequired = reasonRequired;
		this._evidenceRequired = evidenceRequired;
		this._logChannelId = logChannelId ?? null;
	}

	get enabled(): boolean {
		return this._enabled;
	}
	set enabled(value: boolean) {
		this._enabled = value;
	}

	get logChannelId(): string | null {
		return this._logChannelId;
	}

	set logChannelId(value: string | null) {
		this._logChannelId = value;
	}
	get reasonRequired(): boolean {
		return this._reasonRequired;
	}

	set reasonRequired(value: boolean) {
		this._reasonRequired = value;
	}

	get evidenceRequired(): boolean {
		return this._evidenceRequired;
	}

	set evidenceRequired(value: boolean) {
		this._evidenceRequired = value;
	}

	abstract getActionKey(): string;

	abstract saveToDatabase(): Promise<UpdateWriteOpResult>;

	async createSettingsContainer(
		config: ModerationSettings,
		//@ts-ignore
		properties: {}
	): Promise<ContainerBuilder> {
		const container = new ContainerBuilder().setAccentColor([0, 170, 255]);
		const settingsDisplay: string[] = [];

		if (this.enabled === true) {
			this.enabled === config.enabled
				? settingsDisplay.push(`**Command Status:** ✅ Enabled` as string)
				: settingsDisplay.push(`✨ **Command Status:** ✅ Enabled` as string);
		} else {
			this.enabled === config.enabled
				? settingsDisplay.push(`**Command Status:** 🔴 Disabled` as string)
				: settingsDisplay.push(`✨ **Command Status:** 🔴 Disabled` as string);
		}

		if (this.reasonRequired === true) {
			this.reasonRequired === config.reasonRequired
				? settingsDisplay.push(`**Reason Required:** ✅ Yes` as string)
				: settingsDisplay.push(`✨ **Reason Required:** ✅ Yes` as string);
		} else {
			this.reasonRequired === config.reasonRequired
				? settingsDisplay.push(`**Reason Required:** ❌ No` as string)
				: settingsDisplay.push(`✨ **Reason Required:** ❌ No` as string);
		}

		if (this.evidenceRequired === true) {
			this.evidenceRequired === config.evidenceRequired
				? settingsDisplay.push(`**Evidence Required:** ✅ Yes` as string)
				: settingsDisplay.push(`✨ **Evidence Required:** ✅ Yes` as string);
		} else {
			this.evidenceRequired === config.evidenceRequired
				? settingsDisplay.push(`**Evidence Required:** ❌ No` as string)
				: settingsDisplay.push(`✨ **Evidence Required:** ❌ No` as string);
		}

		if (this.logChannelId === undefined || this.logChannelId === null) {
			let logChannelId = this.logChannelId;

			if (logChannelId === undefined) {
				logChannelId = null;
				this.logChannelId = logChannelId;
			}

			if (logChannelId !== config.logChannelId) {
				settingsDisplay.push(
					`✨ **Log Channel:** *None configured, if a default action log channel was set, it will be used instead*` as string
				);
			} else {
				settingsDisplay.push(
					`**Log Channel:** *None configured, if a default action log channel was set, it will be used instead*` as string
				);
			}
		} else {
			if (this.logChannelId !== config.logChannelId) {
				settingsDisplay.push(
					`✨ **Log Channel:** ${channelMention(
						this.logChannelId as Snowflake
					)}` as string
				);
			} else {
				settingsDisplay.push(
					`**Log Channel:** ${channelMention(
						this.logChannelId as Snowflake
					)}` as string
				);
			}
		}

		container.addTextDisplayComponents(
			new TextDisplayBuilder().setContent(
				settingsDisplay.join("\n\n") as string
			)
		);
		return container;
	}
}
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
		return await timeoutCommandSetttings.updateOne(
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
			title = `## Timeout Command Configuration (Changes unsaved)` as string;
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

export class ThrowSettings extends FunSettings {
	private _customItems: string[];
	private _customItemsOnly: boolean;

	constructor(
		guildId: string,
		enabled: boolean,
		cooldown?: number | null,
		customItems?: string[],
		customItemsOnly?: boolean
	) {
		super(guildId, enabled, cooldown);
		this._customItems = customItems ?? [];
		this._customItemsOnly = customItemsOnly ?? false;
	}

	get customItems(): string[] {
		return this._customItems;
	}

	get customItemsOnly(): boolean {
		return this._customItemsOnly;
	}

	set customItemsOnly(value: boolean) {
		this._customItemsOnly = value;
	}

	addCustomItems(customItems: string[]): this {
		this._customItems.push(...customItems);
		return this;
	}

	removeCustomItems(customItems: string[]): this {
		const filteredArray = this._customItems.filter(
			(entry) => !customItems.includes(entry)
		);
		this._customItems = filteredArray;
		return this;
	}

	validateNewThrowItems(rawInput: string): {
		validItems: string[];
		summaryMessage: string;
		rejectedItems?: { item: string; reasons: string[] }[];
	} {
		const items = rawInput
			.split(`,`)
			.map((s) => s.trim())
			.filter((s) => s.length > 0);
		const validItems: string[] = [];
		const rejectedItems: { item: string; reasons: string[] }[] = [];
		const invalidCharRegex = /[*_`~|#<>[\](){}'"@\\\/!?.,;:^+=-]/;
		const existingItems: string[] = [];
		for (const item of items) {
			const reasons: string[] = [];
			if (
				this.customItems
					.map((s) => s.trim().toLowerCase())
					.includes(item.toLowerCase())
			) {
				existingItems.push(item);
				continue;
			}
			if (invalidCharRegex.test(item)) {
				reasons.push(`Contains illegal characters`);
			}
			if (item.length >= 52) {
				reasons.push(`Item exceeds 52 character limit`);
			}
			if (reasons.length > 0) {
				rejectedItems.push({ item, reasons });
			} else {
				validItems.push(item);
			}
		}
		const filteredValidItems = validItems.filter(
			(item) => !existingItems.includes(item)
		);
		let summaryLines: string[] = [];

		if (filteredValidItems.length > 0) {
			summaryLines.push(
				`✅ ${filteredValidItems.length} item(s) passed validation and will be added.\n`
			);
		}
		if (existingItems.length > 0) {
			summaryLines.push(
				`ℹ️ ${existingItems.length} item(s) were already in the list and were skipped.`
			);
		}
		if (rejectedItems.length > 0) {
			summaryLines.push(`⚠️ ${rejectedItems.length} item(s) were rejected.`);
			if (rejectedItems.length <= 5) {
				summaryLines.push(
					...rejectedItems.map(
						({ item, reasons }) =>
							`• \`${item || "(empty)"}\`: ${reasons.join(", ")}`
					)
				);
			} else {
				const uniqueReasons = new Set<string>();
				for (const r of rejectedItems) {
					r.reasons.forEach((reason) => uniqueReasons.add(reason));
				}
				summaryLines.push(
					`Reasons for rejected items: ${[...uniqueReasons].join(", ")}`
				);
			}
		}

		return {
			validItems: filteredValidItems,
			rejectedItems: rejectedItems,
			summaryMessage: summaryLines.join("\n"),
		};
	}

	validateRemovedThrowItems(rawInput: string): {
		itemsToRemove: string[];
		notFoundItems: string[];
		summaryMessage: string;
	} {
		const itemMap = new Map<string, string>();
		for (const rawItem of rawInput.split(`,`)) {
			const trimmed = rawItem.trim();

			if (trimmed.length === 0) continue;

			const normalized = trimmed.toLowerCase();
			if (!itemMap.has(normalized)) {
				itemMap.set(normalized, trimmed);
			}
		}

		if (itemMap.size === 0)
			return {
				itemsToRemove: [],
				notFoundItems: [],
				summaryMessage: "⚠️ No changes were made, no items were specified.",
			};
		const items = Array.from(itemMap.values());
		const itemsToRemove: string[] = [];
		const notFoundItems: string[] = [];
		const normalizedExistingItems = new Set(
			this.customItems.map((s) => s.trim().toLowerCase())
		);
		for (const item of items) {
			if (normalizedExistingItems.has(item.toLowerCase())) {
				itemsToRemove.push(item);
			} else {
				notFoundItems.push(item);
			}
		}

		const summaryLines = [];

		if (itemsToRemove.length > 0) {
			summaryLines.push(
				`✅ ${itemsToRemove.length} item(s) removed from the list.`
			);
		}
		if (notFoundItems.length > 0) {
			summaryLines.push(
				`ℹ️ ${notFoundItems.length} item(s) not found and skipped.`
			);
		}

		return {
			itemsToRemove: itemsToRemove,
			notFoundItems: notFoundItems,
			summaryMessage: summaryLines.join("\n"),
		};
	}
	/**
	 * Creates a pre-made container for display in the throw command's settings menu
	 *
	 * @param interaction The command interaction this function is tied to
	 * @param config The config document that is tied to the guild the command is being ran in
	 * @param saved Whether changes have been saved or not when this function is called
	 * @returns container acting as a settings menu
	 */
	async createSettingsContainer(
		config: ThrowSettings,
		saved: boolean,
		disabled?: boolean
	): Promise<ContainerBuilder> {
		const container = new ContainerBuilder().setAccentColor([0, 170, 255]);
		const changesMade = this.hasChanges(config);
		const settingsDisplay: string[] = [];
		let title: string;
		if (saved === true) {
			title = `## Throw Command Configuration (Changes Saved)` as string;
		} else if (this.hasChanges(config) === true) {
			title = `## Throw Command Configuration (Changes unsaved)` as string;
		} else {
			title = `## Throw Command Configuration` as string;
		}

		settingsDisplay.push(title);
		if (this.enabled === true) {
			settingsDisplay.push(`**Command Enabled:** ✅ Yes` as string);
		} else {
			settingsDisplay.push(`**Command Enabled:** ❌ No` as string);
		}

		if (this.cooldown !== null) {
			if (this.cooldown !== config.cooldown) {
				const cooldown = prettyMilliseconds(this.cooldown);
				settingsDisplay.push(`✨ **Cooldown:** ${cooldown}` as string);
			} else {
				const cooldown = prettyMilliseconds(this.cooldown);
				settingsDisplay.push(`**Cooldown:** ${cooldown}` as string);
			}
		} else {
			if (this.cooldown !== config.cooldown) {
				settingsDisplay.push(`✨ **Cooldown:** *None configured*` as string);
			} else settingsDisplay.push(`**Cooldown:** *None configured*` as string);
		}
		if (this.customItemsOnly === true) {
			settingsDisplay.push(
				this.customItemsOnly === config.customItemsOnly
					? (`**Custom Items Only:** ✅ Enabled` as string)
					: (`✨ **Custom Items Only:** ✅ Enabled` as string)
			);
		} else if (this.customItemsOnly === false) {
			if (this.customItems.length < 30) {
				settingsDisplay.push(
					this.customItemsOnly === false && config.customItemsOnly === false
						? (`**Custom Items Only:** ❌ Disabled, not enough custom items to enable` as string)
						: (`✨ **Custom Items Only:** ❌ Disabled, not enough custom items to enable` as string)
				);
			} else if (this.customItems.length >= 30) {
				settingsDisplay.push(
					this.customItemsOnly === false && config.customItemsOnly === false
						? (`**Custom Items Only:** ❌ Disabled` as string)
						: (`✨ **Custom Items Only:** ❌ Disabled` as string)
				);
			}
		}
		let previewItems = this.customItems.slice(0, 5).join(`, `).toString();
		if (this.customItems.length === 0) {
			previewItems = `*No custom items have been added*` as string;
			settingsDisplay.push(
				arraysEqual(this.customItems, config.customItems)
					? (`**Custom Items:** ${previewItems}` as string)
					: (`✨ **Custom Items:** ${previewItems}` as string)
			);
			const content = settingsDisplay.join("\n\n").toString();
			container.addTextDisplayComponents(
				new TextDisplayBuilder().setContent(content as string)
			);
		} else if (this.customItems.length > 0 && this.customItems.length <= 5) {
			settingsDisplay.push(
				arraysEqual(this.customItems, config.customItems)
					? (`**Custom Items:** ${previewItems}` as string)
					: (`✨ **Custom Items:** ${previewItems}` as string)
			);
			const content = settingsDisplay.join("\n\n").toString();
			container.addTextDisplayComponents(
				new TextDisplayBuilder().setContent(content as string)
			);
		} else if (this.customItems.length > 5) {
			previewItems += `\n and ${this.customItems.length - 5} more`;
			const content = settingsDisplay.join("\n\n").toString();
			container.addTextDisplayComponents(
				new TextDisplayBuilder().setContent(content as string)
			);
			const customItemsSection = new SectionBuilder()
				.addTextDisplayComponents(
					new TextDisplayBuilder().setContent(
						arraysEqual(this.customItems, config.customItems)
							? (`**Custom Items:** ${previewItems}` as string)
							: (`✨ **Custom Items:** ${previewItems}` as string)
					)
				)
				.setButtonAccessory(
					new ButtonBuilder()
						.setCustomId(`preview_full_item_list`)
						.setLabel(`View Full List`)
						.setStyle(ButtonStyle.Primary)
						.setDisabled(
							disabled === true ? true : saved === true ? true : false
						)
				);
			container.addSectionComponents(customItemsSection);
		}
		const configurationButtons =
			new ActionRowBuilder<ButtonBuilder>().addComponents([
				new ButtonBuilder()
					.setCustomId(`toggle_enabled_state`)
					.setEmoji("🔁")
					.setLabel(`Toggle Enabled Status`)
					.setStyle(ButtonStyle.Secondary)
					.setDisabled(
						disabled === true ? true : saved === true ? true : false
					),
				new ButtonBuilder()
					.setCustomId(`toggle_custom_items_only`)
					.setEmoji("🔁")
					.setLabel(`Toggle Custom Items Only`)
					.setStyle(ButtonStyle.Secondary)
					.setDisabled(
						disabled === true || saved === true
							? true
							: this.customItems.length >= 30
							? false
							: true
					),
				new ButtonBuilder()
					.setCustomId(`add_custom_items`)
					.setEmoji("🛠️")
					.setLabel(`Add Custom Items`)
					.setStyle(ButtonStyle.Secondary)
					.setDisabled(
						disabled === true ? true : saved === true ? true : false
					),
				new ButtonBuilder()
					.setCustomId(`remove_custom_items`)
					.setEmoji(`🗑️`)
					.setLabel(`Remove Custom Items`)
					.setStyle(ButtonStyle.Secondary)
					.setDisabled(
						disabled === true ? true : saved === true ? true : false
					),
			]);

		const configurationButtons2 =
			new ActionRowBuilder<ButtonBuilder>().addComponents([
				new ButtonBuilder()
					.setCustomId(`set_cooldown`)
					.setLabel(`Set Cooldown`)
					.setEmoji("🛠️")
					.setStyle(ButtonStyle.Secondary)
					.setDisabled(disabled === true || saved === true ? true : false),
				new ButtonBuilder()
					.setCustomId(`remove_cooldown`)
					.setLabel(`Remove Cooldown`)
					.setEmoji(`🗑️`)
					.setStyle(ButtonStyle.Secondary)
					.setDisabled(disabled === true || saved === true ? true : false),
			]);

		container.addActionRowComponents<MessageActionRowComponentBuilder>([
			configurationButtons,
			configurationButtons2,
		]);

		container.addSeparatorComponents(
			new SeparatorBuilder()
				.setDivider(true)
				.setSpacing(SeparatorSpacingSize.Large)
		);
		if (saved === false) {
			container.addActionRowComponents(
				new ActionRowBuilder<ButtonBuilder>().addComponents([
					new ButtonBuilder()
						.setCustomId(`prev_page`)
						.setLabel(`Go Back`)
						.setEmoji(`↩️`)
						.setStyle(ButtonStyle.Primary)
						.setDisabled(disabled === true ? true : false),
					new ButtonBuilder()
						.setCustomId(`cancel`)
						.setLabel(`Cancel`)
						.setEmoji(`❌`)
						.setStyle(ButtonStyle.Secondary)
						.setDisabled(disabled === true ? true : false),
					new ButtonBuilder()
						.setCustomId(`save_changes`)
						.setLabel(`Save Changes`)
						.setEmoji(`💾`)
						.setStyle(ButtonStyle.Success)
						.setDisabled(
							disabled === true ? true : changesMade === true ? false : true
						),
				])
			);
		} else if (saved === true) {
			container.addTextDisplayComponents(
				new TextDisplayBuilder().setContent(
					`Would you like to continue configuring other \`fun\` settings?`
				)
			);
			container.addActionRowComponents(
				new ActionRowBuilder<ButtonBuilder>().addComponents([
					new ButtonBuilder()
						.setLabel(`Yes, I want configure other settings`)
						.setCustomId(`prev_page`)
						.setEmoji("✅")
						.setStyle(ButtonStyle.Secondary)
						.setDisabled(disabled === true ? true : false),
					new ButtonBuilder()
						.setLabel(`No, I'm done here`)
						.setEmoji(`❌`)
						.setStyle(ButtonStyle.Secondary)
						.setCustomId(`finished`)
						.setDisabled(disabled === true ? true : false),
				])
			);
		}

		return container;
	}

	override hasChanges(config: ThrowSettings): boolean {
		if (
			this.customItemsOnly !== config.customItemsOnly ||
			this.enabled !== config.enabled ||
			!arraysEqual(this.customItems, config.customItems) ||
			this.cooldown !== config.cooldown
		) {
			return true;
		} else return false;
	}
	createFullItemListContainer(): ContainerBuilder {
		if (this.customItems.length <= 5) {
			throw new Error(`Not Enough Custom Items`);
		}

		const container = new ContainerBuilder().setAccentColor([0, 207, 128]);

		const title = `# Complete Custom Items List`;
		container.addTextDisplayComponents(
			new TextDisplayBuilder().setContent(title)
		);

		const separator = new SeparatorBuilder()
			.setDivider(true)
			.setSpacing(SeparatorSpacingSize.Large);
		container.addSeparatorComponents(separator);
		const ItemList = new TextDisplayBuilder().setContent(
			this.customItems.join(", ") +
				`\n\n **Total Item Count:** ${this.customItems.length} items`
		);
		container.addTextDisplayComponents(ItemList);

		return container;
	}

	async saveToDatabase() {
		return await throwCommandSettings.updateOne(
			{ guildId: this._guildId },
			{
				$set: {
					customItems: this.customItems,
					customItemsOnly: this.customItemsOnly,
					enabled: this.enabled,
					cooldown: this.cooldown,
				},
			},
			{ new: true }
		);
	}
}
