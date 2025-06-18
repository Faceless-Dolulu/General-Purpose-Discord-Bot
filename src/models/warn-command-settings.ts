import { model, Schema } from "mongoose";
import { WarnSettings } from "../classes/warn-settings.js";

const WarnConfig = new Schema<WarnSettings>({
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
export default model(`Warn Command Settings`, WarnConfig);
