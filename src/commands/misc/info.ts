import { SlashCommandProps } from "commandkit";
import {
	ActivityType,
	ChannelType,
	ContainerBuilder,
	GuildMember,
	InteractionContextType,
	MessageFlags,
	roleMention,
	SectionBuilder,
	SeparatorBuilder,
	SeparatorSpacingSize,
	SlashCommandBuilder,
	TextDisplayBuilder,
	ThumbnailBuilder,
	time,
	User,
} from "discord.js";
import prettyMilliseconds from "pretty-ms";

export const data = new SlashCommandBuilder()
	.setName("info")
	.setDescription(`Get information about a user or the server.`)
	.setContexts(InteractionContextType.Guild)
	.addSubcommand((subcommand) =>
		subcommand
			.setName("user")
			.setDescription("Get information about a user.")
			.addUserOption((option) =>
				option
					.setName("target")
					.setDescription("The user to get information about.")
					.setRequired(false)
			)
	)
	.addSubcommand((subcommand) =>
		subcommand
			.setName("server")
			.setDescription("Get information about the server.")
	);
export async function run({ interaction }: SlashCommandProps) {
	const subcommand = interaction.options.getSubcommand();
	await interaction.deferReply({ flags: MessageFlags.Ephemeral });

	if (subcommand === "user") {
		const targetInfo: string[] = [];
		const target =
			(interaction.options.getMember("target") ||
				interaction.options.getUser("target")) ??
			interaction.member;
		if (target instanceof GuildMember) {
			const targetNickname = target.nickname ?? "No nickname set.";
			const targetUsername = target.user.username;
			const targetStatus =
				target.presence?.activities.find(
					(activity) => activity.type === ActivityType.Custom
				)?.state ?? "User is offline or has no status set.";
			const targetRoles =
				target.roles.cache
					.filter((role) => role.id !== interaction.guildId)
					.sort((a, b) => b.position - a.position)
					.map((role) => roleMention(role.id))
					.join(", ") || "No roles have been assigned.";
			const targetAccountAge = prettyMilliseconds(
				Date.now() - target.user.createdAt.getTime(),
				{ verbose: true, unitCount: 2 }
			);
			const targetJoinDate = time(
				Math.floor((target.joinedAt?.getTime() ?? 0) / 1000),
				`f`
			);
			const targetJoinAge = prettyMilliseconds(
				Date.now() - (target.joinedAt?.getTime() ?? 0),
				{ verbose: true, unitCount: 2 }
			);
			targetInfo.push(
				`**Nickname:** ${targetNickname}\n`,
				`**Status:** ${targetStatus}\n`,
				`**Roles:** ${targetRoles}\n`,
				`**Account Creation Date:** ${time(
					Math.floor((target.user.createdAt?.getTime() ?? 0) / 1000),
					`f`
				)} (${targetAccountAge} ago)\n`,
				`**Join Date:** ${targetJoinDate} (${targetJoinAge} ago)\n`
			);

			const targetAvatar = target.user.displayAvatarURL();

			const targetInfoContainer = new ContainerBuilder();
			targetInfoContainer.addTextDisplayComponents(
				new TextDisplayBuilder().setContent(
					`### ${targetUsername}'s Info (ID: ${target.id})\n\n`
				)
			);
			targetInfoContainer.addSeparatorComponents(
				new SeparatorBuilder()
					.setDivider(true)
					.setSpacing(SeparatorSpacingSize.Large)
			);
			targetInfoContainer.addSectionComponents(
				new SectionBuilder()
					.addTextDisplayComponents(
						new TextDisplayBuilder().setContent(targetInfo.join("\n"))
					)
					.setThumbnailAccessory(new ThumbnailBuilder().setURL(targetAvatar))
			);
			targetInfoContainer.addSeparatorComponents(
				new SeparatorBuilder()
					.setDivider(true)
					.setSpacing(SeparatorSpacingSize.Large)
			);
			targetInfoContainer.addTextDisplayComponents(
				new TextDisplayBuilder().setContent(
					`-# Information valid as of ${time(new Date(), "f")}`
				)
			);

			targetInfoContainer.setAccentColor(0x00ff00);
			return await interaction.followUp({
				components: [targetInfoContainer],
				flags: [
					MessageFlags.IsComponentsV2,
					MessageFlags.SuppressNotifications,
				],
			});
		} else if (target instanceof User) {
			const targetUsername = target.username;
			const targetAvatar = target.displayAvatarURL();
			const targetAccountCreationDate = time(
				Math.floor((target.createdAt?.getTime() ?? 0) / 1000),
				`f`
			);
			const targetAccountAge = prettyMilliseconds(
				Date.now() - target.createdAt.getTime(),
				{ verbose: true, unitCount: 2 }
			);

			targetInfo.push(
				`**Account Creation Date:** ${targetAccountCreationDate} (${targetAccountAge} ago)\n`
			);
			const targetInfoContainer = new ContainerBuilder();
			targetInfoContainer.addTextDisplayComponents(
				new TextDisplayBuilder().setContent(
					`# ${targetUsername}'s Info (ID: ${target.id})\n\n`
				)
			);
			targetInfoContainer.addSeparatorComponents(
				new SeparatorBuilder()
					.setDivider(true)
					.setSpacing(SeparatorSpacingSize.Large)
			);
			targetInfoContainer.addTextDisplayComponents(
				new TextDisplayBuilder().setContent(
					`# ${targetUsername}'s Info (ID: ${target.id})\n\n`
				)
			);
			targetInfoContainer.addSectionComponents(
				new SectionBuilder()
					.addTextDisplayComponents(
						new TextDisplayBuilder().setContent(targetInfo.join("\n\n"))
					)
					.setThumbnailAccessory(new ThumbnailBuilder().setURL(targetAvatar))
			);
			targetInfoContainer.addSeparatorComponents(
				new SeparatorBuilder()
					.setDivider(true)
					.setSpacing(SeparatorSpacingSize.Large)
			);
			targetInfoContainer.addTextDisplayComponents(
				new TextDisplayBuilder().setContent(
					`-# Information valid as of ${time(new Date(), "f")}`
				)
			);

			targetInfoContainer.setAccentColor(0x00ff00);
			return await interaction.followUp({
				components: [targetInfoContainer],
				flags: [
					MessageFlags.IsComponentsV2,
					MessageFlags.SuppressNotifications,
				],
			});
		} else {
			return await interaction.followUp({
				content: "⚠️ You shouldn't be seeing this. Please make a bug report.",
				flags: [MessageFlags.Ephemeral],
			});
		}
	} else if (subcommand === "server") {
		const serverName = interaction.guild?.name;
		const serverId = interaction.guild?.id;
		await interaction.guild?.fetch();
		const serverMemberCount = interaction.guild?.approximateMemberCount;
		const serverCreatedAt = time(
			Math.floor((interaction.guild?.createdTimestamp ?? 0) / 1000),
			`f`
		);
		const serverCreatedAtAge = prettyMilliseconds(
			Date.now() - (interaction.guild?.createdAt?.getTime() ?? 0),
			{ verbose: true, unitCount: 2 }
		);
		const serverIcon = interaction.guild?.iconURL();
		const serverRoles =
			interaction.guild?.roles.cache
				.filter((role) => role.id !== interaction.guildId)
				.filter((role) => !role.tags?.botId)
				.sort((a, b) => b.position - a.position)
				.map((role) => roleMention(role.id))
				.join(", ") || "No roles exist in this server.";
		const serverOwner = await interaction.guild?.members.fetch(
			interaction.guild.ownerId
		);
		const serverOwnerName = serverOwner?.user.username;
		const serverOwnerId = serverOwner?.user.id;
		const serverCategoryChannelCount =
			interaction.guild?.channels.cache.filter(
				(channel) => channel.type === ChannelType.GuildCategory
			).size ?? 0;
		const serverTextChannelCount =
			interaction.guild?.channels.cache.filter(
				(channel) => channel.type === ChannelType.GuildText
			).size ?? 0;
		const serverVoiceChannelCount =
			interaction.guild?.channels.cache.filter(
				(channel) => channel.type === ChannelType.GuildVoice
			).size ?? 0;
		const serverStageChannelCount =
			interaction.guild?.channels.cache.filter(
				(channel) => channel.type === ChannelType.GuildStageVoice
			).size ?? 0;
		const serverForumChannelCount =
			interaction.guild?.channels.cache.filter(
				(channel) => channel.type === ChannelType.GuildForum
			).size ?? 0;
		const serverAnnouncementChannelCount =
			interaction.guild?.channels.cache.filter(
				(channel) => channel.type === ChannelType.GuildAnnouncement
			).size ?? 0;
		const serverThreadChannelCount =
			interaction.guild?.channels.cache.filter(
				(channel) =>
					channel.type === ChannelType.PublicThread ||
					channel.type === ChannelType.PrivateThread
			).size ?? 0;

		const totalChannelCount =
			serverCategoryChannelCount +
			serverTextChannelCount +
			serverVoiceChannelCount +
			serverStageChannelCount +
			serverForumChannelCount +
			serverAnnouncementChannelCount +
			serverThreadChannelCount;

		const serverInfoContainer = new ContainerBuilder();
		serverInfoContainer.addTextDisplayComponents(
			new TextDisplayBuilder().setContent(
				`### ${serverName} Server Info \n(ID: ${serverId})\n\n`
			)
		);
		serverInfoContainer.addSeparatorComponents(
			new SeparatorBuilder()
				.setDivider(true)
				.setSpacing(SeparatorSpacingSize.Large)
		);
		let serverInfo;
		if (serverIcon) {
			serverInfo = new SectionBuilder()
				.addTextDisplayComponents(
					new TextDisplayBuilder().setContent(
						`**Owner:** ${serverOwnerName} (ID: ${serverOwnerId})\n` +
							`**Member Count:** ${serverMemberCount}\n` +
							`**Bot Count:** ${
								interaction.guild?.members.cache.filter(
									(member) => member.user.bot
								).size
							}\n` +
							`**Server Boosts:** ${interaction.guild?.premiumSubscriptionCount}\n` +
							`**Created At:** ${serverCreatedAt} (${serverCreatedAtAge} ago)\n` +
							`**Roles:** ${serverRoles}\n` +
							`**Total Channels:** ${totalChannelCount}\n` +
							`**Text Channels:** ${serverTextChannelCount}\n` +
							`**Voice Channels:** ${serverVoiceChannelCount}\n` +
							`**Stage Channels:** ${serverStageChannelCount}\n` +
							`**Forum Channels:** ${serverForumChannelCount}\n` +
							`**Announcement Channels:** ${serverAnnouncementChannelCount}\n` +
							`**Thread Channels:** ${serverThreadChannelCount}\n`
					)
				)
				.setThumbnailAccessory(
					new ThumbnailBuilder().setURL(serverIcon as string)
				);
		} else {
			serverInfo = new TextDisplayBuilder().setContent(
				`**Owner:** ${serverOwnerName} (ID: ${serverOwnerId})\n` +
					`**Member Count:** ${serverMemberCount}\n` +
					`**Bot Count:** ${
						interaction.guild?.members.cache.filter((member) => member.user.bot)
							.size
					}\n` +
					`**Server Boosts:** ${interaction.guild?.premiumSubscriptionCount}\n` +
					`**Created At:** ${serverCreatedAt} (${serverCreatedAtAge} ago)\n` +
					`**Roles:** ${serverRoles}\n` +
					`**Total Channels:** ${totalChannelCount}\n` +
					`**Text Channels:** ${serverTextChannelCount}\n` +
					`**Voice Channels:** ${serverVoiceChannelCount}\n` +
					`**Stage Channels:** ${serverStageChannelCount}\n` +
					`**Forum Channels:** ${serverForumChannelCount}\n` +
					`**Announcement Channels:** ${serverAnnouncementChannelCount}\n` +
					`**Thread Channels:** ${serverThreadChannelCount}\n`
			);
			serverInfoContainer.addTextDisplayComponents(serverInfo);
		}

		serverInfoContainer.addSeparatorComponents(
			new SeparatorBuilder()
				.setDivider(true)
				.setSpacing(SeparatorSpacingSize.Large)
		);
		serverInfoContainer.addTextDisplayComponents(
			new TextDisplayBuilder().setContent(
				`-# Information valid as of ${time(new Date(), "f")}`
			)
		);
		serverInfoContainer.setAccentColor(0x00ff00);
		return await interaction.followUp({
			components: [serverInfoContainer],
			flags: [MessageFlags.IsComponentsV2, MessageFlags.SuppressNotifications],
		});
	} else {
		return await interaction.followUp({
			content: "⚠️ You shouldn't be seeing this. Please make a bug report.",
			flags: [MessageFlags.Ephemeral],
		});
	}
}
