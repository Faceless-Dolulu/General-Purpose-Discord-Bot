import { model, Schema } from "mongoose";
import { TimeoutSettings } from "../classes/command-settings.js";

const TimeoutConfig = new Schema<TimeoutSettings>({
	guildId: {
		type: String,
		required: true,
		index: true,
	},
	enabled: {
		type: Boolean,
		default: false,
	},
	reasonRequired: {
		type: Boolean,
		default: false,
	},
	evidenceRequired: {
		type: Boolean,
		default: false,
	},
	logChannelId: {
		type: String,
		default: null,
	},
	defaultDuration: {
		type: Number,
		required: true,
		default: 1_800_000, // 30 minutes
	},
});

export default model(`Timeout Command Settings`, TimeoutConfig);
