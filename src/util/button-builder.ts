import {
	ButtonBuilder,
	ButtonStyle,
	ComponentEmojiResolvable,
	Snowflake,
} from "discord.js";

export type ButtonProps =
	| {
			style: "premium";
			SKUId: Snowflake;
			customId?: never;
			url?: never;
			label: string;
			emoji?: ComponentEmojiResolvable;
			disabled?: boolean;
	  }
	| {
			style: "primary" | "secondary" | "success" | "danger";
			skuId?: never;
			customId?: string;
			url?: never;
			label: string;
			emoji?: ComponentEmojiResolvable;
			disabled?: boolean;
	  }
	| {
			style: "link";
			skuId?: never;
			customId?: string;
			url: string;
			label: string;
			emoji?: ComponentEmojiResolvable;
			disabled?: boolean;
	  };

export function createButton(properties: ButtonProps): ButtonBuilder {
	const button = new ButtonBuilder()
		.setLabel(properties.label)
		.setDisabled(properties.disabled ?? false);

	if (properties.emoji) {
		button.setEmoji(properties.emoji);
	}

	switch (properties.style) {
		case "premium":
			button.setStyle(ButtonStyle.Premium).setSKUId(properties.SKUId);
			break;
		case "primary":
			button.setStyle(ButtonStyle.Primary);
			break;
		case "secondary":
			button.setStyle(ButtonStyle.Secondary);
			break;
		case "success":
			button.setStyle(ButtonStyle.Success);
			break;
		case "danger":
			button.setStyle(ButtonStyle.Danger);
			break;
		case "link":
			button.setStyle(ButtonStyle.Link).setURL(properties.url);
			break;
	}

	if (properties.customId) {
		button.setCustomId(properties.customId);
	}

	return button;
}
