import { model, Schema } from "mongoose";
import { ThrowSettings } from "../classes/throw-settings.js";

const ThrowConfig = new Schema<ThrowSettings>({
	guildId: { type: String, required: true, unique: true },
	enabled: { type: Boolean, default: true },
	customItems: { type: [String], default: [] },
	cooldown: { type: Number, default: null },
	customItemsOnly: { type: Boolean, default: false },
});

export default model(`Throw Command Settings`, ThrowConfig);
