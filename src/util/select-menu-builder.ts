import {
	ChannelSelectMenuBuilder,
	GuildChannelType,
	RoleSelectMenuBuilder,
	Snowflake,
	StringSelectMenuBuilder,
	UserSelectMenuBuilder,
} from "discord.js";

type SelectMenuProps =
	| {
			type: "channel";
			channelTypes?: GuildChannelType | GuildChannelType[];
			customId?: string;
			disabled?: boolean;
			maxValues?: number;
			minValues?: number;
			placeholder?: string;
			defaultValues?: Snowflake[] | Snowflake | null;
	  }
	| {
			type: "role" | "user";
			customId?: string;
			disabled?: boolean;
			maxValues?: number;
			minValues?: number;
			placeholder?: string;
			defaultValues?: Snowflake[] | Snowflake | null;
			channelTypes?: never;
	  }
	| {
			type: "string";
			options: {
				label: string;
				value: string;
			}[];
			customId?: string;
			disabled?: boolean;
			maxValues?: number;
			minValues?: number;
			placeholder?: string;
			defaultValues?: never;
			channelTypes?: never;
	  };

export function createSelectMenu(
	properties: SelectMenuProps
):
	| RoleSelectMenuBuilder
	| UserSelectMenuBuilder
	| ChannelSelectMenuBuilder
	| StringSelectMenuBuilder {
	switch (properties.type) {
		case "channel":
			const channelSelectMenu = new ChannelSelectMenuBuilder()
				.setDisabled(properties.disabled ?? false)
				.setMaxValues(properties.maxValues ?? 1)
				.setMinValues(properties.minValues ?? 1)
				.setPlaceholder(properties.placeholder ?? "Select a channel");
			if (properties.customId)
				channelSelectMenu.setCustomId(properties.customId);
			if (properties.defaultValues)
				channelSelectMenu.setDefaultChannels(...properties.defaultValues);
			if (properties.channelTypes !== undefined) {
				const channelTypes = Array.isArray(properties.channelTypes)
					? properties.channelTypes
					: [properties.channelTypes];
				channelSelectMenu.setChannelTypes(...channelTypes);
			}
			return channelSelectMenu;
		case "role":
			const roleSelectMenu = new RoleSelectMenuBuilder()
				.setDisabled(properties.disabled ?? false)
				.setMaxValues(properties.maxValues ?? 1)
				.setMinValues(properties.minValues ?? 1)
				.setPlaceholder(properties.placeholder ?? "Select a role");
			if (properties.customId) roleSelectMenu.setCustomId(properties.customId);
			if (properties.defaultValues)
				roleSelectMenu.setDefaultRoles(...properties.defaultValues);
			return roleSelectMenu;
		case "user":
			const userSelectMenu = new UserSelectMenuBuilder()
				.setDisabled(properties.disabled ?? false)
				.setMaxValues(properties.maxValues ?? 1)
				.setMinValues(properties.minValues ?? 1)
				.setPlaceholder(properties.placeholder ?? "Select a user");
			if (properties.customId) userSelectMenu.setCustomId(properties.customId);
			if (properties.defaultValues)
				userSelectMenu.setDefaultUsers(...properties.defaultValues);
			return userSelectMenu;
		case "string":
			const stringSelectMenu = new StringSelectMenuBuilder()
				.setOptions(...properties.options)
				.setDisabled(properties.disabled ?? false)
				.setMaxValues(properties.maxValues ?? 1)
				.setMinValues(properties.minValues ?? 1)
				.setPlaceholder(properties.placeholder ?? "Select an option");
			if (properties.customId)
				stringSelectMenu.setCustomId(properties.customId);
			return stringSelectMenu;
	}
}
