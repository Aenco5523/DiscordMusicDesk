import { randomUUID } from "node:crypto";
import type { Command, Connection, Playback, Settings, Snapshot, Track } from "../shared/contracts";
import { AppError, assertNever, userMessage } from "../shared/contracts";
import { youtubeInput } from "../shared/validation";
import { moveTrack, PlaybackClock, removeTrack } from "./queue";
import type { Storage } from "./storage";
export interface MediaPort {
  metadata(url: string): Promise<{ title: string; duration: number }>;
  playlist(url: string): Promise<readonly { url: string; title: string; duration: number }[]>;
  prepare(track: Track, signal: AbortSignal): Promise<string>;
  fileFor(id: string): string | undefined;
  dispose(): void;
}
export interface VoicePort {
  connect(token: string): Promise<void>;
  join(id: string): Promise<void>;
  leave(): void;
  play(file: string, position: number): void;
  pause(): void;
  resume(): void;
  setVolume(value: number): void;
  stopAudio(): void;
  dispose(): void;
}
export interface ControllerOptions {
  readonly storage: Storage;
  readonly media: MediaPort;
  readonly voice: VoicePort;
  readonly publish: (snapshot: Snapshot) => void;
}
export class Controller {
  private queue: readonly Track[];
  private settings: Settings;
  private notice: string | null;
  private revision = 0;
  private conn: Connection = {
    status: "offline",
    botName: null,
    channelId: null,
    channelName: null,
    error: null,
  };
  private playback: Playback = {
    trackId: null,
    status: "idle",
    position: 0,
    duration: 0,
    generation: 0,
    mediaUrl: null,
  };
  private clock = new PlaybackClock();
  private abort: AbortController | null = null;
  private timer: ReturnType<typeof setInterval>;
  private adds: Promise<void> = Promise.resolve();
  private adding = 0;
  private disposed = false;
  private connecting = false;
  constructor(private readonly options: ControllerOptions) {
    const data = options.storage.load();
    this.queue = data.queue;
    this.settings = data.settings;
    this.notice = data.notice;
    options.voice.setVolume(this.settings.discordVolume);
    this.timer = setInterval(() => this.tick(), 250);
  }
  snapshot(): Snapshot {
    return {
      revision: this.revision,
      queue: this.queue,
      settings: this.settings,
      hasToken: this.options.storage.hasToken(),
      connection: this.conn,
      notice: this.notice,
      busy: this.adding > 0,
      playback: {
        ...this.playback,
        position: Math.min(this.playback.duration, this.clock.position),
      },
    };
  }
  private emit(): void {
    if (!this.disposed) {
      this.revision++;
      this.options.publish(this.snapshot());
    }
  }
  private persist(): void {
    this.options.storage.save(this.settings, this.queue);
  }
  report(message: string): void {
    this.notice = message;
    this.emit();
  }
  connection(state: Connection): void {
    this.conn = state;
    this.emit();
  }
  async add(input: string, by: string, authorize?: () => boolean): Promise<void> {
    if (authorize && !authorize())
      throw new AppError("VOICE_AUTH", "봇과 같은 음성방에 참가해야 영상을 추가할 수 있습니다.");
    const source = youtubeInput(input);
    this.adding++;
    this.emit();
    const run = this.adds.then(async () => {
      if (this.disposed) return;
      if (this.queue.length >= 200)
        throw new AppError("QUEUE_FULL", "재생목록은 최대 200곡까지 추가할 수 있습니다.");
      const entries =
        source.kind === "playlist"
          ? await this.options.media.playlist(source.url)
          : [{ url: source.url, ...(await this.options.media.metadata(source.url)) }];
      if (this.disposed) return;
      if (this.queue.length + entries.length > 200)
        throw new AppError("QUEUE_FULL", "재생목록은 최대 200곡까지 추가할 수 있습니다.");
      if (authorize && !authorize())
        throw new AppError("VOICE_AUTH", "음성방 참가 상태가 변경되어 추가하지 않았습니다.");
      this.queue = [
        ...this.queue,
        ...entries.map((entry) => ({
          id: randomUUID(),
          url: entry.url,
          title: entry.title,
          duration: entry.duration,
          addedBy: by,
          status: "queued" as const,
          error: null,
        })),
      ];
      this.persist();
    });
    this.adds = run.catch((error) => {
      if (error instanceof Error) this.report(userMessage(error));
      else throw error;
    });
    try {
      await run;
    } finally {
      this.adding--;
      this.emit();
    }
  }
  async command(command: Command): Promise<void> {
    switch (command.type) {
      case "add":
        return this.add(command.url, "PC");
      case "select":
        return this.select(command.id);
      case "toggle":
        return this.toggle();
      case "next":
        return this.step(1);
      case "previous":
        if (this.clock.position > 3) {
          this.seek(0);
          return;
        }
        return this.step(-1);
      case "seek":
        this.seek(command.position);
        break;
      case "remove": {
        const index = this.queue.findIndex((t) => t.id === command.id);
        this.queue = removeTrack(this.queue, command.id);
        if (this.playback.trackId === command.id) {
          this.reset();
          const next = this.queue[index] ?? this.queue[index - 1];
          if (next) void this.select(next.id).catch((error) => this.report(userMessage(error)));
        }
        this.persist();
        break;
      }
      case "move":
        this.queue = moveTrack(this.queue, command.id, command.direction);
        this.persist();
        break;
      case "volume":
        this.settings = {
          ...this.settings,
          ...(command.target === "pc"
            ? { pcVolume: command.value }
            : { discordVolume: command.value }),
        };
        if (command.target === "discord") this.options.voice.setVolume(command.value);
        this.persist();
        break;
      case "saveToken":
        this.options.voice.dispose();
        this.options.storage.saveToken(command.token);
        this.notice = "봇 토큰을 암호화하여 저장했습니다. 봇 연결을 눌러 주세요.";
        break;
      case "forgetToken":
        this.options.voice.dispose();
        this.options.storage.forgetToken();
        this.notice = "저장된 봇 토큰을 삭제했습니다.";
        break;
      case "connect":
        return this.connect();
      case "join":
        if (this.conn.status !== "online" && this.conn.status !== "joined") await this.connect();
        this.settings = { ...this.settings, channelId: command.channelId };
        this.persist();
        await this.options.voice.join(command.channelId);
        this.restartVoice();
        break;
      case "leave":
        this.options.voice.leave();
        break;
      case "dismiss":
        this.notice = null;
        break;
      default:
        assertNever(command);
    }
    this.emit();
  }
  private async connect(): Promise<void> {
    if (this.connecting) throw new AppError("BUSY", "봇에 연결 중입니다. 잠시 기다려 주세요.");
    const token = this.options.storage.token();
    if (!token) throw new AppError("TOKEN", "설정에서 봇 토큰을 먼저 저장해 주세요.");
    this.connecting = true;
    try {
      await this.options.voice.connect(token);
    } finally {
      this.connecting = false;
      this.emit();
    }
  }
  private reset(): void {
    this.abort?.abort();
    this.abort = null;
    this.clock.pause();
    this.clock.seek(0);
    this.options.voice.stopAudio();
    this.playback = {
      trackId: null,
      status: "idle",
      position: 0,
      duration: 0,
      generation: this.playback.generation + 1,
      mediaUrl: null,
    };
  }
  private async select(id: string): Promise<void> {
    const selected = this.queue.find((t) => t.id === id);
    if (!selected) throw new AppError("TRACK", "재생목록에서 곡을 찾을 수 없습니다.");
    let track: Track = selected;
    this.reset();
    const abort = new AbortController();
    this.abort = abort;
    const generation = this.playback.generation;
    this.playback = {
      trackId: id,
      status: "preparing",
      position: 0,
      duration: track.duration,
      generation,
      mediaUrl: null,
    };
    this.queue = this.queue.map((t) =>
      t.id === id ? { ...t, status: "preparing", error: null } : t,
    );
    this.emit();
    try {
      if (track.duration <= 0) {
        const metadata = await this.options.media.metadata(track.url);
        if (abort.signal.aborted || generation !== this.playback.generation || this.disposed)
          return;
        track = { ...track, ...metadata };
        this.queue = this.queue.map((t) => (t.id === id ? track : t));
        this.playback = { ...this.playback, duration: metadata.duration };
        this.persist();
        this.emit();
      }
      const file = await this.options.media.prepare(track, abort.signal);
      if (abort.signal.aborted || generation !== this.playback.generation || this.disposed) return;
      this.queue = this.queue.map((t) =>
        t.id === id ? { ...t, status: "ready", error: null } : t,
      );
      this.clock.start(0);
      this.playback = {
        ...this.playback,
        status: "playing",
        mediaUrl: `music-media://track/${id}`,
      };
      if (this.conn.status === "joined") this.options.voice.play(file, 0);
      this.persist();
    } catch (error) {
      if (abort.signal.aborted) return;
      this.clock.pause();
      const message = userMessage(error);
      this.playback = { ...this.playback, status: "error" };
      this.queue = this.queue.map((t) =>
        t.id === id ? { ...t, status: "error", error: message } : t,
      );
      this.notice = message;
      throw error;
    } finally {
      this.emit();
    }
  }
  private async toggle(): Promise<void> {
    switch (this.playback.status) {
      case "playing":
        this.clock.pause();
        this.playback = { ...this.playback, status: "paused" };
        this.options.voice.pause();
        break;
      case "paused":
        this.clock.start(this.clock.position);
        this.playback = { ...this.playback, status: "playing" };
        this.restartVoice();
        break;
      case "preparing":
        this.reset();
        break;
      case "idle":
      case "error": {
        const first = this.queue.find((t) => t.id === this.playback.trackId) ?? this.queue[0];
        if (first) return this.select(first.id);
        break;
      }
      default:
        assertNever(this.playback.status);
    }
    this.emit();
  }
  private seek(position: number): void {
    if (!this.playback.mediaUrl) return;
    this.clock.seek(Math.min(position, Math.max(0, this.playback.duration - 0.05)));
    this.playback = { ...this.playback, generation: this.playback.generation + 1 };
    this.restartVoice();
  }
  private restartVoice(): void {
    if (this.conn.status !== "joined") return;
    const file = this.playback.trackId
      ? this.options.media.fileFor(this.playback.trackId)
      : undefined;
    if (file && this.playback.status === "playing")
      this.options.voice.play(file, this.clock.position);
    else this.options.voice.stopAudio();
  }
  private async step(direction: -1 | 1): Promise<void> {
    const index = this.queue.findIndex((t) => t.id === this.playback.trackId);
    const next = this.queue[index + direction];
    if (next) await this.select(next.id);
  }
  private tick(): void {
    if (this.disposed) return;
    if (this.playback.status === "playing" && this.clock.position >= this.playback.duration) {
      const index = this.queue.findIndex((t) => t.id === this.playback.trackId);
      const next = this.queue[index + 1];
      if (next) void this.select(next.id).catch((error) => this.report(userMessage(error)));
      else {
        this.clock.pause();
        this.clock.seek(0);
        this.playback = {
          ...this.playback,
          status: "paused",
          generation: this.playback.generation + 1,
        };
        this.options.voice.stopAudio();
      }
    }
    this.emit();
  }
  dispose(): void {
    this.disposed = true;
    clearInterval(this.timer);
    this.abort?.abort();
    this.options.media.dispose();
    this.options.voice.dispose();
  }
}
