import {
	ActivityType,
	ChatInputCommandInteraction,
	Collection,
	Colors,
	Client as DJSClient,
	EmbedBuilder,
	GatewayIntentBits,
	Interaction,
	PresenceUpdateStatus,
	REST,
	Routes,
} from "discord.js";
import readCommands from "~/utils/readCommands";
import type Command from "~/types/Command";
import type { MusicQueue } from "~/types/Music";

export default class Client extends DJSClient {
	public declare token: string;
	commands: Collection<string, Command>;
	public musicQueues: Collection<string, MusicQueue>;

	constructor(token: string, commandsPath: string) {
		super({
			intents: [
				GatewayIntentBits.Guilds,
				GatewayIntentBits.GuildMessages,
				GatewayIntentBits.MessageContent,
				GatewayIntentBits.DirectMessageTyping,
				GatewayIntentBits.DirectMessages,
				GatewayIntentBits.GuildVoiceStates,
			],
		});

		this.commands = new Collection();
		this.musicQueues = new Collection();
		this.token = token;

		void readCommands(this.commands, commandsPath);

		this.once("ready", this.onceReady.bind(this));
		this.on("interactionCreate", this.onInteractionCreate.bind(this));
	}

	public login(): Promise<string> {
		return super.login(this.token);
	}

	// TODO: maybe move event the handlers to a separate folder & file
	private async onInteractionCreate(interaction: Interaction) {
		if (interaction.isChatInputCommand()) {
			const command = this.commands.get(interaction.commandName);
			if (!command) return;
			try {
				await command.execute(
					interaction as ChatInputCommandInteraction<"cached"> & { client: Client },
				);
			}
			catch (err) {
				console.error(err);
				await interaction.reply({
					embeds: [
						new EmbedBuilder()
							.setColor(Colors.Red)
							.setTitle("Error!")
							.setDescription("There was an error upon processing your command!")
							.setTimestamp(),
					],
				});
			}
		}
	}

	private async onceReady(client: DJSClient<true>) {
		const rest = new REST({ version: "10" }).setToken(this.token);

		client.user.setPresence({
			activities: [{ name: "onigirya", type: ActivityType.Listening }],
			status: PresenceUpdateStatus.Idle,
		});

		try {
			await rest.put(Routes.applicationCommands(this.user!.id), {
				body: this.commands.map((cmd) => cmd.data.toJSON()),
			});
			console.log("Commands successfully updated!");
			console.log("Registered commands : ");
			this.commands.forEach((_, name) => console.log(`- ${name}`));
		}
		catch (e) {
			console.error(e);
		}

		console.log(`Mogu mogu! Client: ${client.user?.tag}`);
	}
}
