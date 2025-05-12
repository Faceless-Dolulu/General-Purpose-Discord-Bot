import {
	ActionRowBuilder,
	APIMessageComponentEmoji,
	ButtonBuilder,
	ButtonStyle,
	ContainerBuilder,
	Interaction,
	MessageFlags,
	SectionBuilder,
	SeparatorBuilder,
	SeparatorSpacingSize,
	StringSelectMenuBuilder,
	TextDisplayBuilder,
} from "discord.js";
import { funMenuHandlers } from "./menu-router.js";

export async function initialFunSettingsMenu<T extends Interaction>(
	interaction: T
) {
	const funSettings = [
		{
			label: `Throw Command`,
			value: `throw-command`,
		},
	];

	const selectMenu = new StringSelectMenuBuilder()
		.setCustomId(`SelectFunSettings`)
		.setPlaceholder(`Choose a command to configure`)
		.addOptions(funSettings);

	const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
		selectMenu
	);
	const cancelButton = new ButtonBuilder()
		.setCustomId(`cancel`)
		.setLabel(`Cancel`)
		.setEmoji(`❌` as APIMessageComponentEmoji)
		.setStyle(ButtonStyle.Secondary);

	let menu;

	const container = new ContainerBuilder();
	const title = new TextDisplayBuilder().setContent(
		`# Fun Commands Configuration\n\nSelect which command you want to configure below:`
	);
	const cancelSection = new SectionBuilder()
		.addTextDisplayComponents(
			new TextDisplayBuilder().setContent(`Press here to cancel the process:`)
		)
		.setButtonAccessory(cancelButton);
	container
		.addTextDisplayComponents(title)
		.addSeparatorComponents(
			new SeparatorBuilder()
				.setDivider(true)
				.setSpacing(SeparatorSpacingSize.Large)
		)
		.addActionRowComponents(row)
		.addSectionComponents(cancelSection);

	if (interaction.isChatInputCommand()) {
		menu = await interaction.reply({
			components: [container],
			flags: MessageFlags.IsComponentsV2,
		});
	} else if (interaction.isButton()) {
		menu = await interaction.update({
			components: [container],
			flags: MessageFlags.IsComponentsV2,
		});
	} else return;

	const collector = menu.createMessageComponentCollector({
		filter: (i) => i.user.id === interaction.user.id,
		time: 120_000,
	});
	collector.on(`collect`, async (i) => {
		if (i.isStringSelectMenu()) {
			collector.stop();
			const selected = i.values[0];
			const handler = funMenuHandlers[selected];
			return await handler(i);
		} else if (i.isButton()) {
			switch (i.customId) {
				case "cancel":
					row.components.forEach((component) => component.setDisabled(true));
					container.spliceComponents(2, 1, row).spliceComponents(3, 1);
					await menu.edit({
						components: [container],
						flags: MessageFlags.IsComponentsV2,
					});
					return collector.stop(`cancelled`);
			}
		}
	});
	collector.on(`ignore`, async (i) => {
		return await i.reply({
			content: `⚠️ This menu is not for you`,
			flags: MessageFlags.Ephemeral,
		});
	});
	collector.on(`end`, async () => {
		switch (collector.endReason) {
			case `time`:
				row.components.forEach((component) => component.setDisabled(true));
				container.spliceComponents(2, 1, row).spliceComponents(3, 1);
				await menu.edit({
					components: [container],
					flags: MessageFlags.IsComponentsV2,
				});
				return await interaction.followUp({
					content: `ℹ️ Process timed out.`,
					flags: MessageFlags.Ephemeral,
				});

			case "cancelled":
				return await interaction.followUp({
					content: `ℹ️ Process cancelled. All unsaved changes have been lost.`,
					flags: MessageFlags.Ephemeral,
				});
			default:
				return;
		}
	});
}
