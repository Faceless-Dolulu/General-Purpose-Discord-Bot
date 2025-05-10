import { Client, IntentsBitField, Partials } from "discord.js";
import { CommandKit } from "commandkit";
import path from "path";
import { S3Client } from "@aws-sdk/client-s3";
import "dotenv/config";
import mongoose from "mongoose";
const client = new Client({
	intents: [
		IntentsBitField.Flags.Guilds,
		IntentsBitField.Flags.MessageContent,
		IntentsBitField.Flags.GuildMembers,
		IntentsBitField.Flags.GuildMessages,
		IntentsBitField.Flags.GuildModeration,
		IntentsBitField.Flags.GuildPresences,
		IntentsBitField.Flags.GuildMessageReactions,
	],
	partials: [
		Partials.Channel,
		Partials.GuildMember,
		Partials.Message,
		Partials.Reaction,
	],
});

const __dirname = import.meta.dirname;
new CommandKit({
	client,
	commandsPath: path.join(__dirname, "commands"),
	eventsPath: path.join(__dirname, "events"),
	validationsPath: path.join(__dirname, "validations"),
	skipBuiltInValidations: false,
	devUserIds: ["306958469439684608"],
	devGuildIds: ["1306696123766931486", "1322655860228493312"],
	bulkRegister: true,
});

export const r2 = new S3Client({
	region: "auto",
	endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
	credentials: {
		accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID as string,
		secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY as string,
	},
});

mongoose.connect(String(process.env.DB_URL)).then(() => {
	console.log(`Connected to database.`);
	client.login(process.env.BOT_TOKEN);
});
