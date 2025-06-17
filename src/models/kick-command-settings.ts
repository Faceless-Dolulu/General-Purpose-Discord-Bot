import { model, Schema } from "mongoose";
import { KickSettings } from "../classes/kick-settings.js";

const KickConfig = new Schema<KickSettings>({
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

export default model(`Kick Command Settings`, KickConfig);
