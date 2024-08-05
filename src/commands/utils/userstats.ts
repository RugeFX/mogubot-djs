import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

export default {
	data: new SlashCommandBuilder()
		.setName("userstats")
		.setDescription("Replies with your username and ID")
		.addUserOption((option) =>
			option
				.setName("user")
				.setDescription("Choose a user that you want to see the stats from.")
				.setRequired(false),
		),
	async execute(interaction: ChatInputCommandInteraction) {
		const user = interaction.options.getUser("user");

		if (user) {
			await interaction.reply(`Their username is : ${user.username} and their ID is : ${user.id}`);
			return;
		}
		await interaction.reply(
			`Your username is : ${interaction.user.username} and your ID is : ${interaction.user.id}`,
		);
	},
};
