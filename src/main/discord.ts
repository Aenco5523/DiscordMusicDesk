import {
  entersState,
  joinVoiceChannel,
  type VoiceConnection,
  VoiceConnectionStatus,
} from "@discordjs/voice";
import {
  ChannelType,
  type ChatInputCommandInteraction,
  Client,
  Events,
  GatewayIntentBits,
  MessageFlags,
  PermissionFlagsBits,
} from "discord.js";
import { AppError, type Connection } from "../shared/contracts";
import { mayAddFromVoice, youtubeInput } from "../shared/validation";
import { addVideoCommand, discordError, discordReply } from "./discord-locale";
import { VoiceAudio } from "./voice";

type Options = Readonly<{
  ffmpegPath: string;
  onConnection: (state: Connection) => void;
  onAdd: (url: string, addedBy: string, authorize?: () => boolean) => Promise<void>;
  onError: (message: string) => void;
}>;
export class DiscordService {
  private client: Client | null = null;
  private voice: VoiceConnection | null = null;
  private generation = 0;
  private joinGeneration = 0;
  private state: Connection = {
    status: "offline",
    botName: null,
    channelId: null,
    channelName: null,
    error: null,
  };
  private readonly audio: VoiceAudio;
  constructor(private readonly options: Options) {
    this.audio = new VoiceAudio(options.ffmpegPath, options.onError);
  }
  private publish(patch: Partial<Connection>): void {
    this.state = { ...this.state, ...patch };
    this.options.onConnection(this.state);
  }
  async connect(token: string): Promise<void> {
    this.dispose();
    const generation = this.generation;
    const client = new Client({
      intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
    });
    this.client = client;
    client.on(Events.Error, () =>
      this.options.onError("Discord 연결 오류가 발생했습니다. 연결 상태를 확인해 주세요."),
    );
    client.on(Events.InteractionCreate, (interaction) => {
      if (interaction.isChatInputCommand() && interaction.commandName === "영상추가")
        void this.add(interaction);
    });
    this.publish({ status: "connecting", error: null });
    try {
      await client.login(token);
      if (generation !== this.generation) return;
      this.publish({ status: "online", botName: client.user?.tag ?? null });
    } catch {
      // no-excuse-ok: catch -- never expose SDK errors containing credentials.
      if (generation !== this.generation) return;
      this.dispose();
      const error = new AppError(
        "DISCORD_LOGIN",
        "Discord에 연결하지 못했습니다. 봇 토큰과 인터넷 연결을 확인해 주세요.",
      );
      this.publish({ status: "error", error: error.message });
      throw error;
    }
  }
  async join(channelId: string): Promise<void> {
    const client = this.client;
    if (!client?.isReady())
      throw new AppError("DISCORD_OFFLINE", "먼저 Discord 봇을 연결해 주세요.");
    const generation = this.generation;
    this.leave();
    const joinGeneration = this.joinGeneration;
    this.publish({ status: "joining", error: null });
    try {
      const channel = await client.channels.fetch(channelId);
      if (generation !== this.generation || joinGeneration !== this.joinGeneration) return;
      if (channel?.type !== ChannelType.GuildVoice)
        throw new AppError("DISCORD_CHANNEL", "일반 음성 채널 ID를 입력해 주세요.");
      const me = await channel.guild.members.fetchMe();
      if (
        !channel.permissionsFor(me)?.has([PermissionFlagsBits.Connect, PermissionFlagsBits.Speak])
      )
        throw new AppError(
          "DISCORD_PERMISSION",
          "봇에 이 음성 채널의 연결 및 말하기 권한이 필요합니다.",
        );
      if (generation !== this.generation || joinGeneration !== this.joinGeneration) return;
      const voice = joinVoiceChannel({
        channelId: channel.id,
        guildId: channel.guild.id,
        adapterCreator: channel.guild.voiceAdapterCreator,
        selfDeaf: true,
        selfMute: false,
        daveEncryption: true,
      });
      this.voice = voice;
      voice.on("error", () => {
        if (this.voice === voice) {
          this.leave();
          this.options.onError("음성 연결 오류가 발생했습니다. 채널에 다시 참가해 주세요.");
        }
      });
      voice.on(VoiceConnectionStatus.Disconnected, () => {
        void this.recover(voice);
      });
      await entersState(voice, VoiceConnectionStatus.Ready, 20_000);
      if (
        this.voice !== voice ||
        generation !== this.generation ||
        joinGeneration !== this.joinGeneration
      )
        return;
      voice.subscribe(this.audio.player);
      this.publish({ status: "joined", channelId: channel.id, channelName: channel.name });
      await channel.guild.commands.create(addVideoCommand());
    } catch (error) {
      if (generation !== this.generation || joinGeneration !== this.joinGeneration) return;
      this.leave();
      const safe =
        error instanceof AppError
          ? error
          : new AppError(
              "DISCORD_JOIN",
              "음성 채널 참가 또는 명령 등록에 실패했습니다. 채널 ID와 봇 권한을 확인해 주세요.",
            );
      this.publish({ status: "error", error: safe.message });
      throw safe;
    }
  }
  private async recover(voice: VoiceConnection): Promise<void> {
    if (this.voice !== voice) return;
    this.publish({ status: "joining" });
    try {
      await Promise.race([
        entersState(voice, VoiceConnectionStatus.Signalling, 5_000),
        entersState(voice, VoiceConnectionStatus.Connecting, 5_000),
      ]);
      await entersState(voice, VoiceConnectionStatus.Ready, 20_000);
      if (this.voice === voice) this.publish({ status: "joined", error: null });
    } catch {
      // no-excuse-ok: catch -- disconnected voice errors are translated at this boundary.
      if (this.voice === voice) {
        this.leave();
        this.options.onError("음성 연결이 끊어졌습니다. 채널에 다시 참가해 주세요.");
      }
    }
  }
  private authorized(guildId: string, userId: string): boolean {
    const client = this.client;
    const voice = this.voice;
    if (
      !client?.isReady() ||
      !voice ||
      voice.state.status !== VoiceConnectionStatus.Ready ||
      this.state.status !== "joined"
    )
      return false;
    const guild = client.guilds.cache.get(guildId);
    if (!guild || !client.user) return false;
    const memberChannel = guild.voiceStates.cache.get(userId)?.channelId ?? null;
    const botChannel = guild.voiceStates.cache.get(client.user.id)?.channelId ?? null;
    return (
      botChannel === voice.joinConfig.channelId &&
      mayAddFromVoice(
        { guildId, channelId: memberChannel },
        { guildId: voice.joinConfig.guildId, channelId: botChannel },
      )
    );
  }
  private async allowed(interaction: ChatInputCommandInteraction): Promise<boolean> {
    const guild = interaction.guild;
    const voice = this.voice;
    if (!guild || !voice || voice.state.status !== VoiceConnectionStatus.Ready) return false;
    const [member, bot] = await Promise.all([
      guild.members.fetch(interaction.user.id),
      guild.members.fetchMe(),
    ]);
    return (
      this.voice === voice &&
      mayAddFromVoice(
        { guildId: guild.id, channelId: member.voice.channelId },
        { guildId: voice.joinConfig.guildId, channelId: bot.voice.channelId },
      ) &&
      bot.voice.channelId === voice.joinConfig.channelId
    );
  }
  private async add(interaction: ChatInputCommandInteraction): Promise<void> {
    try {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      if (!(await this.allowed(interaction))) {
        await interaction.editReply(discordReply(interaction.locale, "voiceRequired"));
        return;
      }
      const url = youtubeInput(interaction.options.getString("url", true)).url;
      if (!(await this.allowed(interaction))) {
        await interaction.editReply(discordReply(interaction.locale, "channelChanged"));
        return;
      }
      const generation = this.generation;
      const joinGeneration = this.joinGeneration;
      const authorize = (): boolean =>
        generation === this.generation &&
        joinGeneration === this.joinGeneration &&
        interaction.guildId !== null &&
        this.authorized(interaction.guildId, interaction.user.id);
      await this.options.onAdd(url, interaction.user.displayName, authorize);
      const stillAllowed = await this.allowed(interaction);
      await interaction.editReply(
        stillAllowed
          ? discordReply(interaction.locale, "added")
          : discordReply(interaction.locale, "addedChanged"),
      );
    } catch (error) {
      const message = discordError(interaction.locale, error);
      try {
        if (interaction.deferred || interaction.replied) await interaction.editReply(message);
        else await interaction.reply({ content: message, flags: MessageFlags.Ephemeral });
      } catch {
        this.options.onError("Discord 명령 응답을 전송하지 못했습니다.");
      } // no-excuse-ok: catch -- expired interaction is an external boundary.
    }
  }
  leave(): void {
    this.joinGeneration++;
    const voice = this.voice;
    this.voice = null;
    this.audio.stop();
    if (voice && voice.state.status !== VoiceConnectionStatus.Destroyed) voice.destroy();
    this.publish({
      status: this.client?.isReady() ? "online" : "offline",
      channelId: null,
      channelName: null,
    });
  }
  play(file: string, position: number): void {
    if (this.voice?.state.status === VoiceConnectionStatus.Ready) this.audio.play(file, position);
  }
  pause(): void {
    this.audio.pause();
  }
  resume(): void {
    this.audio.resume();
  }
  setVolume(value: number): void {
    this.audio.setVolume(value);
  }
  stopAudio(): void {
    this.audio.stop();
  }
  dispose(): void {
    this.generation++;
    this.leave();
    this.client?.destroy();
    this.client = null;
    this.publish({ status: "offline", botName: null, error: null });
  }
}
