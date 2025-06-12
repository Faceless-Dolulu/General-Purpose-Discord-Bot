import { model, Schema } from "mongoose";

const MuteConfig = new Schema({
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
	muteRoleId: {
		type: String,
		required: true,
		default: null,
	},
});

export default model(`Mute Command Settings`, MuteConfig);
