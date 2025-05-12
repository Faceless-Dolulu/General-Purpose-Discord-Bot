import {
	ActionRowBuilder,
	ButtonStyle,
	ChannelType,
	ContainerBuilder,
	Interaction,
	MessageComponentInteraction,
	SeparatorSpacingSize,
	ButtonBuilder,
	ChannelSelectMenuBuilder,
	MessageActionRowComponentBuilder,
	SectionBuilder,
	SeparatorBuilder,
	TextDisplayBuilder,
} from "discord.js";
import prettyMilliseconds from "pretty-ms";
import { arraysEqual } from "../util/arrays-equal.js";

abstract class CommandSettings {
	protected _guildId: string;
	constructor(guildId: string) {
		this._guildId = guildId;
	}

	get guildId(): string {
		return this._guildId;
	}
}

abstract class FunSettings extends CommandSettings {
	protected _blacklistedChannels: string[];
	protected _cooldown: number | null;

	constructor(
		guildId: string,
		blacklistedChannels: string[],
		cooldown?: number | null
	) {
		super(guildId);
		this._blacklistedChannels = blacklistedChannels;
		this._cooldown = cooldown ?? null;
	}

	get cooldown(): number | null {
		return this._cooldown;
	}

	get blacklistedChannels(): string[] {
		return this._blacklistedChannels;
	}
}

export class ThrowSettings extends FunSettings {
	private _customItems: string[];
	private _customItemsOnly: boolean;

	constructor(
		guildId: string,
		blackListedChannels: string[],
		cooldown?: number | null,
		customItems?: string[],
		customItemsOnly?: boolean
	) {
		super(guildId, blackListedChannels, cooldown);
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

	/**
	 * @param interaction The command interaction this function is tied to
	 * @param config The config document that is tied to the guild the command is being ran in
	 * @param saved Whether changes have been saved or not when this function is called
	 * @returns container acting as a settings menu
	 */
	async createContainer<T extends Interaction | MessageComponentInteraction>(
		interaction: T,
		config: ThrowSettings,
		saved: boolean
	): Promise<ContainerBuilder> {
		function hasChanges(
			config: ThrowSettings,
			newSettings: ThrowSettings
		): boolean {
			if (newSettings.customItemsOnly !== config.customItemsOnly) return true;
			else if (!arraysEqual(newSettings.customItems, config.customItems))
				return true;
			else if (
				!arraysEqual(
					newSettings.blacklistedChannels,
					config.blacklistedChannels
				)
			)
				return true;
			else if (newSettings.cooldown !== config.cooldown) return true;
			else return false;
		}
		const container = new ContainerBuilder().setAccentColor([0, 170, 255]);
		const changesMade = hasChanges(config, this);
		const settingsDisplay: string[] = [];
		let title: string;
		if (saved === true) {
			title = `# Throw Command Configuration (Changes Saved)` as string;
		} else if (hasChanges(config, this) === true) {
			title = `# Throw Command Configuration (Changes unsaved)` as string;
		} else {
			title = `# Throw Command Configuration` as string;
		}

		settingsDisplay.push(title);
		if (this.cooldown !== null) {
			const cooldown = prettyMilliseconds(this.cooldown);
			settingsDisplay.push(`**Cooldown:** ${cooldown}` as string);
		} else {
			settingsDisplay.push(`**Cooldown:** *None configured*` as string);
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
						.setDisabled(saved === true ? true : false)
				);
			container.addSectionComponents(customItemsSection);
		}
		const configurationButtons =
			new ActionRowBuilder<ButtonBuilder>().addComponents([
				new ButtonBuilder()
					.setCustomId(`add_custom_items`)
					.setEmoji("🛠️")
					.setLabel(`Add Custom Items`)
					.setStyle(ButtonStyle.Secondary)
					.setDisabled(saved === true ? true : false),
				new ButtonBuilder()
					.setCustomId(`remove_custom_items`)
					.setEmoji(`🗑️`)
					.setLabel(`Remove Custom Items`)
					.setStyle(ButtonStyle.Secondary)
					.setDisabled(saved === true ? true : false),
				new ButtonBuilder()
					.setCustomId(`toggle_custom_items_only`)
					.setLabel(`Toggle Custom Items Only`)
					.setStyle(ButtonStyle.Secondary)
					.setDisabled(this.customItems.length >= 30 ? false : true),
			]);

		container.addActionRowComponents<MessageActionRowComponentBuilder>(
			configurationButtons
		);
		let blacklistedChannelsDisplay: TextDisplayBuilder;

		if (
			this.blacklistedChannels.length === 0 ||
			this.blacklistedChannels === null
		) {
			if (this.blacklistedChannels === null) {
				const array: string[] = [];
				blacklistedChannelsDisplay = new TextDisplayBuilder().setContent(
					arraysEqual(array, config.blacklistedChannels)
						? (`**Blacklisted Channels:** *None configured*` as string)
						: (`✨ **Blacklisted Channels:** *None configured*` as string)
				);
			} else {
				blacklistedChannelsDisplay = new TextDisplayBuilder().setContent(
					arraysEqual(this.blacklistedChannels, config.blacklistedChannels)
						? (`**Blacklisted Channels:** *None configured*` as string)
						: (`✨ **Blacklisted Channels:** *None configured*` as string)
				);
			}
		} else {
			blacklistedChannelsDisplay = new TextDisplayBuilder().setContent(
				arraysEqual(this.blacklistedChannels, config.blacklistedChannels)
					? (`**Blacklisted Channels:** ${this.blacklistedChannels
							.join(`, `)
							.toString()}` as string)
					: (`✨ **Blacklisted Channels:** ${this.blacklistedChannels
							.join(`, `)
							.toString()}` as string)
			);
		}
		container.addTextDisplayComponents(blacklistedChannelsDisplay);

		container.addActionRowComponents(
			new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
				new ChannelSelectMenuBuilder()
					.addChannelTypes(ChannelType.GuildText)
					.addDefaultChannels(...(this.blacklistedChannels || []))
					.setCustomId(`blackisted_channels_select`)
					.setMinValues(0)
					.setMaxValues(
						(await interaction.guild?.channels.fetch())?.filter(
							(channel) => channel?.type === ChannelType.GuildText
						).size ?? 1
					)
					.setDisabled(saved === true ? true : false)
			)
		);

		container.addSeparatorComponents(
			new SeparatorBuilder()
				.setDivider(true)
				.setSpacing(SeparatorSpacingSize.Large)
		);
		container.addActionRowComponents(
			new ActionRowBuilder<ButtonBuilder>().addComponents([
				new ButtonBuilder()
					.setCustomId(`prev_page`)
					.setLabel(`Go Back`)
					.setEmoji(`↩️`)
					.setStyle(ButtonStyle.Primary)
					.setDisabled(saved === true ? true : false),
				new ButtonBuilder()
					.setCustomId(`cancel`)
					.setLabel(`Cancel`)
					.setEmoji(`❌`)
					.setStyle(ButtonStyle.Secondary)
					.setDisabled(saved === true ? true : false),
				new ButtonBuilder()
					.setCustomId(`save_changes`)
					.setLabel(`Save Changes`)
					.setEmoji(`💾`)
					.setStyle(ButtonStyle.Success)
					.setDisabled(changesMade === true ? false : true),
			])
		);

		return container;
	}
}
