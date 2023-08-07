import {
  MessageActionRowComponentBuilder,
  SlashCommandBuilder,
} from "@discordjs/builders";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
} from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("testdm")
    .setDescription("Test sending a DM message to a given User")
    .addUserOption((user) =>
      user.setName("user").setDescription("Choose a user.").setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const user = interaction.options.getUser("user");
    const row =
      new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId("primary")
          .setLabel("Click me!")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId("fillet")
          .setLabel("Fillet mignon")
          .setStyle(ButtonStyle.Danger)
          .setEmoji("🗿")
      );
    // const dmChannel = await user.createDM();
    const sentMessage = await interaction.reply({
      content: `Hi, ${user?.username}! I am MoguBot`,
      files: [
        "https://cdn.discordapp.com/avatars/890983889080815647/52643821cca83ed9d4f5f1288556a819.webp?size=1024",
      ],
      components: [row],
    });

    const collector = sentMessage.createMessageComponentCollector({
      time: 15_000,
    });
    row.components.push(
      new ButtonBuilder()
        .setCustomId("fiesta")
        .setLabel("Fiesta ciken naget")
        .setStyle(ButtonStyle.Success)
    );
    collector.on("collect", async (i) => {
      if (i.customId == "fillet") {
        // await i.deferUpdate();
        await i.update({ content: "Fillet mignon", components: [row] });
      }
    });
    // if (sentMessage.attachments.size === 0) {
    //   console.log("No attachments!");
    // } else {
    //   sentMessage?.attachments.forEach((att) => console.log(att.attachment));
    // }
    // console.log(sentMessage.content);
    // await interaction.editReply({ content: `Sent DM to ${user.username}!` });
  },
};
