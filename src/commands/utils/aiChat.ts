import { GoogleGenerativeAI, Content } from "@google/generative-ai";
import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

const MODEL_NAME = "gemini-pro";
const API_KEY = process.env.PALM_API_KEY!;

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: MODEL_NAME });
const convoLog: Content[] = [];

const chat = model.startChat({
  history: convoLog,
  generationConfig: {
    maxOutputTokens: 200,
  },
});

export default {
  data: new SlashCommandBuilder()
    .setName("chat")
    .setDescription("(Experimental) Chat with Okayu!")
    .addStringOption((body) =>
      body.setName("body").setDescription("Prompt body to chat with okayu").setRequired(true)
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    const prompt = interaction.options.getString("body");

    if (!prompt) {
      await interaction.reply("How'd you do that?");
      return;
    }

    await interaction.deferReply();

    const result = await chat.sendMessage(prompt);
    const text = result.response.text();

    console.log(result.response);
    console.log(convoLog);

    await interaction.editReply(text);
  },
};
