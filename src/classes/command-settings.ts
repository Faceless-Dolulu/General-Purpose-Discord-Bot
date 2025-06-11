import {
	ContainerBuilder,
	TextDisplayBuilder,
	channelMention,
	Snowflake,
} from "discord.js";
import { UpdateWriteOpResult } from "mongoose";

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
