import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

interface Command {
  data: SlashCommandBuilder;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

export default Command;
