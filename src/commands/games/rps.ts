import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

export default {
	data: new SlashCommandBuilder()
		.setName("rps")
		.setDescription("Play rock paper scissors with me! (=^ ◡ ^=)")
		.addStringOption((option) =>
			option
				.setName("choice")
				.setDescription("Choose between rock, paper, and scissors.")
				.setRequired(true)
				.addChoices(
					{ name: "Rock", value: "rock" },
					{ name: "Paper", value: "paper" },
					{ name: "Scissors", value: "scissors" },
				),
		),
	async execute(interaction: ChatInputCommandInteraction) {
		const userChoice = interaction.options.getString("choice") as string;
		const choices = ["rock", "paper", "scissors"];
		console.log("User : " + userChoice);

		if (!choices.includes(userChoice)) {
			await interaction.reply("Please pick a valid choice!");
			return;
		}

		const choiceNumber = Math.floor(Math.random() * 3);
		const computerChoice = choices[choiceNumber];
		console.log("Bot : " + computerChoice);

		const result = checkWinner(userChoice, computerChoice);
		await interaction.reply(result);
	},
};

function checkWinner(userChoice: string, computerChoice: string): string {
	if (userChoice == computerChoice) {
		return `You chose **${userChoice}**, and i chose **${computerChoice}** too, so it's a **draw**!`;
	}
	if (userChoice == "rock") {
		if (computerChoice == "paper") {
			return `You chose **${userChoice}**, and i chose **${computerChoice}** which means i **won**!`;
		}
		else {
			return `You chose **${userChoice}**, and i chose **${computerChoice}** which means i **lost**!`;
		}
	}
	if (userChoice == "paper") {
		if (computerChoice == "scissors") {
			return `You chose **${userChoice}**, and i chose **${computerChoice}** which means i **won**!`;
		}
		else {
			return `You chose **${userChoice}**, and i chose **${computerChoice}** which means i **lost**!`;
		}
	}
	if (userChoice == "scissors") {
		if (computerChoice == "rock") {
			return `You chose **${userChoice}**, and i chose **${computerChoice}** which means i **won**!`;
		}
		else {
			return `You chose **${userChoice}**, and i chose **${computerChoice}** which means i **lost**!`;
		}
	}
	return "Error!";
}
