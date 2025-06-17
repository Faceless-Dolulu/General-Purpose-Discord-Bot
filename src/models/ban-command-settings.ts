import { model, Schema } from "mongoose";
import { BanSettings } from "../classes/ban-settings.js";

const BanConfig = new Schema<BanSettings>({
	guildId: {
		type: String,
		required: true,
		index: true,
	},
	enabled: { type: Boolean, default: false },
	reasonRequired: { type: Boolean, default: false },
	evidenceRequired: { type: Boolean, default: false },
	logChannelId: { type: String, default: null },
});

export default model(`Ban Command Settings`, BanConfig);
