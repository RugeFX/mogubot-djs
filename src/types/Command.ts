import { type ChatInputCommandInteraction, type SlashCommandBuilder } from "discord.js";
import type Client from "~/config/Client";

interface Command {
  data: SlashCommandBuilder;
  execute: (
    interaction: ChatInputCommandInteraction<"cached"> & { client: Client }
  ) => Promise<void>;
}

export default Command;
