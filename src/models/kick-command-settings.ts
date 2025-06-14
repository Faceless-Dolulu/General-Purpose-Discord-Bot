import { model, Schema } from "mongoose";

const KickConfig = new Schema({
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
