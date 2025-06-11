import { SlashCommandProps } from "commandkit";
import {
	GuildMember,
	InteractionContextType,
	MessageFlags,
	SlashCommandBuilder,
	userMention,
} from "discord.js";
import { ThrowSettings } from "../../../classes/throw-settings.js";
import {
	commandSettingsCache,
	CommandSettingsKey,
} from "../../../util/command-settings-cache.js";
import throwCommandSettings from "../../../models/throw-command-settings.js";
import { throwableItems } from "./throwable-objects.js";
import { throwResponses } from "./throw-responses.js";
import {
	cooldownCache,
	CooldownKey,
	isOnCooldown,
} from "../../../util/command-on-cooldown.js";

export const data = new SlashCommandBuilder()
	.setName(`throw`)
	.setContexts(InteractionContextType.Guild)
	.setDescription(`Throw things at your friends because its fun`)
	.addUserOption((option) =>
		option
			.setName("target")
			.setDescription("The user you want to throw things at.")
			.setRequired(false)
	);

export async function run({ interaction }: SlashCommandProps) {
	const targetMember = interaction.options.getMember(`target`) as GuildMember;
	const target = targetMember
		? userMention(targetMember.id)
		: "a random person nearby";

	let config: ThrowSettings;
	const key: CommandSettingsKey = `${interaction.guildId}:throw`;
	if (commandSettingsCache.get(key)) {
		config = commandSettingsCache.get(key) as ThrowSettings;
	} else {
		config = (await throwCommandSettings.findOne({
			guildId: interaction.guildId,
		})) as ThrowSettings;
		commandSettingsCache.set(key, config);
	}
	let itemPool: string[] = [];
	if (config.cooldown) {
		const cooldownActive = isOnCooldown(
			interaction.user.id,
			interaction.commandName,
			config.cooldown,
			"guild"
		);
		if (cooldownActive.onCooldown === true) {
			return await interaction.reply({
				content: `⚠️ You are on cooldown. Try again in ${Math.round(
					cooldownActive.retryAfter / 1000
				)} seconds `,
				flags: MessageFlags.Ephemeral,
			});
		} else {
			const key: CooldownKey = `guild:${interaction.guildId}:${interaction.user.id}:${interaction.commandName}`;
			cooldownCache.set(key, config.cooldown);
		}
	}
	if (!config) {
		itemPool = [...throwableItems];
	} else if (!config.customItemsOnly) {
		itemPool = [...throwableItems, ...config.customItems];
	} else if (config.customItemsOnly) {
		itemPool = [...config.customItems];
	}

	if (itemPool.length === 0) {
		return interaction.reply({
			content: `⚠️ No throwable items are configured. If you are seeing this, make a bug report!`,
			flags: MessageFlags.Ephemeral,
		});
	}

	function randomItem() {
		return itemPool[Math.floor(Math.random() * itemPool.length)];
	}

	const rng = Math.floor(Math.random() * 100);
	let responsePool: string[] = [];
	let response: string;
	if (rng <= 5) {
		responsePool = throwResponses.miss;
		response = responsePool[Math.floor(Math.random() * responsePool.length)]
			.replace(`{user}`, userMention(interaction.user.id))
			.replace(`{item}`, randomItem())
			.replace(`{target}`, target as string);
	} else if (rng <= 15) {
		responsePool = throwResponses.threeItem;
		response = responsePool[Math.floor(Math.random() * responsePool.length)]
			.replace(`{user}`, userMention(interaction.user.id))
			.replace(`{item1}`, randomItem())
			.replace(`{item2}`, randomItem())
			.replace(`{item3}`, randomItem())
			.replace(`{target}`, target as string);
	} else if (rng <= 50) {
		responsePool = throwResponses.twoItem;
		response = responsePool[Math.floor(Math.random() * responsePool.length)]
			.replace(`{user}`, userMention(interaction.user.id))
			.replace(`{item1}`, randomItem())
			.replace(`{item2}`, randomItem())
			.replace(`{target}`, target as string);
	} else {
		responsePool = throwResponses.oneItem;
		response = responsePool[Math.floor(Math.random() * responsePool.length)]
			.replace(`{user}`, userMention(interaction.user.id))
			.replace(`{item}`, randomItem())
			.replace(`{target}`, target as string);
	}

	return await interaction.reply(response);
}
