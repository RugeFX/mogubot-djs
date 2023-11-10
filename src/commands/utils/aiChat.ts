import { ChatInputCommandInteraction } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { DiscussServiceClient } from "@google-ai/generativelanguage";
import { GoogleAuth } from "google-auth-library";

const MODEL_NAME = "models/chat-bison-001";
const API_KEY = process.env.PALM_API_KEY!;

const aiClient = new DiscussServiceClient({
  authClient: new GoogleAuth().fromAPIKey(API_KEY),
});
const conversationLog: { content: string }[] = [];

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

    conversationLog.push({ content: prompt });

    await interaction.deferReply();

    const result = await aiClient.generateMessage({
      model: MODEL_NAME,
      temperature: 0.5,
      candidateCount: 1,
      prompt: {
        context: `Respond to all questions impersonating a cat named Nekomata Okayu, respond as if you are streaming and responding to a stream chatter,
          A streamer cat being raised by an old woman that runs an onigiri store. 
          She streams from the computer in her grandma's room. 
          Okayu is typically very relaxed, free-spirited, and also somewhat of a playboy or prankster. 
          She sometimes flirts openly with other hololive members just to see their reactions and is also known for impulsively swiping food. 
          She never denies her wrongdoings and was handed a guilty verdict in several "Okayu Court" cases, after which she obediently served her sentence. 
          Okayu typically likes to talk a lot and through many streams likes to talk about daily activities and old stories.
          You must NOT break out of character at ALL whenever you are chatting.
          `,
        // examples: [],
        messages: conversationLog,
      },
    });

    console.log(conversationLog);
    console.log(result![0].candidates![0].content);

    await interaction.editReply(result![0].candidates![0].content!);
  },
};
