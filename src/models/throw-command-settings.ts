import { model, Schema } from "mongoose";
import { ThrowSettings } from "../classes/command-settings.js";

const ThrowConfig = new Schema<ThrowSettings>({
	guildId: { type: String, required: true, unique: true },
	enabled: { type: Boolean, default: true },
	customItems: { type: [String], default: [] },
	cooldown: { type: Number, default: null },
	customItemsOnly: { type: Boolean, default: false },
	blacklistedChannels: { type: [String], default: [] },
});

export default model(`Throw Command Settings`, ThrowConfig);
