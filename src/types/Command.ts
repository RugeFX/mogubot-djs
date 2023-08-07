import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

type Command = {
  data: SlashCommandBuilder;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
};

export default Command;
