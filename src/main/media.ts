import { mkdir, readdir, rm, stat } from "node:fs/promises";
import { join, resolve } from "node:path";
import { z } from "zod";
import { AppError, type Track } from "../shared/contracts";
import { youtubeInput, youtubeUrl } from "../shared/validation";
import { normalizeMedia } from "./media-normalize";
import { runMedia } from "./media-process";

const LIMIT = 1024 * 1024 * 1024;
const options = ["--ignore-config", "--socket-timeout", "15", "--no-warnings"] as const;
const infoSchema = z.object({
  title: z.string().min(1).max(1000),
  duration: z.number().finite().positive().max(7200),
  is_live: z.boolean().optional(),
  live_status: z.string().optional(),
});
export class MediaService {
  private readonly files = new Map<string, string>();
  private readonly lifetime = new AbortController();
  private readonly active = new Set<string>();
  private readonly cacheDir: string;
  constructor(
    private readonly toolsDir: string,
    cacheDir: string,
    private readonly ytDlpExecutable: () => string = () => join(toolsDir, "yt-dlp.exe"),
  ) {
    this.cacheDir = resolve(cacheDir);
  }
  async metadata(url: string): Promise<{ title: string; duration: number }> {
    const raw = await runMedia(
      this.ytDlpExecutable(),
      [...options, "--no-playlist", "--dump-single-json", "--skip-download", "--", youtubeUrl(url)],
      this.lifetime.signal,
      60000,
    );
    let value: unknown;
    try {
      value = JSON.parse(raw);
    } catch (error) {
      if (error instanceof SyntaxError)
        throw new AppError("MEDIA_METADATA", "영상 정보를 읽지 못했습니다.");
      throw error;
    }
    const parsed = infoSchema.safeParse(value);
    if (
      !parsed.success ||
      parsed.data.is_live ||
      ["is_live", "is_upcoming", "post_live"].includes(parsed.data.live_status ?? "")
    )
      throw new AppError(
        "MEDIA_UNSUPPORTED",
        "2시간 이하의 공개된 일반 영상만 재생할 수 있습니다. 실시간 방송은 지원하지 않습니다.",
      );
    return { title: parsed.data.title, duration: parsed.data.duration };
  }
  async playlist(
    url: string,
  ): Promise<readonly { url: string; title: string; duration: number }[]> {
    const source = youtubeInput(url);
    if (source.kind !== "playlist")
      throw new AppError("URL", "YouTube 재생목록 URL을 입력해 주세요.");
    const raw = await runMedia(
      this.ytDlpExecutable(),
      [
        ...options,
        "--flat-playlist",
        "--playlist-end",
        "201",
        "--dump-single-json",
        "--skip-download",
        "--",
        source.url,
      ],
      this.lifetime.signal,
      120000,
    );
    let value: unknown;
    try {
      value = JSON.parse(raw);
    } catch {
      throw new AppError("MEDIA_METADATA", "재생목록 정보를 읽지 못했습니다.");
    }
    const list = z.object({ entries: z.array(z.unknown()) }).safeParse(value);
    if (!list.success) throw new AppError("MEDIA_METADATA", "재생목록 정보를 읽지 못했습니다.");
    if (list.data.entries.length > 200)
      throw new AppError("QUEUE_FULL", "한 번에 최대 200곡까지 추가할 수 있습니다.");
    const entry = z.object({
      id: z.string().regex(/^[A-Za-z0-9_-]{11}$/),
      title: z.string().min(1).max(1000),
      duration: z.number().finite().nullable().optional(),
      is_live: z.boolean().optional(),
      live_status: z.string().nullable().optional(),
    });
    const tracks = list.data.entries.flatMap((item) => {
      const parsed = entry.safeParse(item);
      if (
        !parsed.success ||
        parsed.data.is_live ||
        ["is_live", "is_upcoming", "post_live"].includes(parsed.data.live_status ?? "")
      )
        return [];
      const duration = parsed.data.duration ?? 0;
      if (duration < 0 || duration > 7200) return [];
      return [
        {
          url: `https://www.youtube.com/watch?v=${parsed.data.id}`,
          title: parsed.data.title,
          duration,
        },
      ];
    });
    if (tracks.length === 0)
      throw new AppError("MEDIA_UNSUPPORTED", "재생할 수 있는 영상이 재생목록에 없습니다.");
    return tracks;
  }
  async prepare(track: Track, signal: AbortSignal): Promise<string> {
    const url = youtubeUrl(track.url);
    if (!z.string().uuid().safeParse(track.id).success)
      throw new AppError("MEDIA_ID", "영상 식별자가 올바르지 않습니다.");
    const combined = AbortSignal.any([signal, this.lifetime.signal]);
    if (combined.aborted) throw new AppError("MEDIA_CANCELLED", "미디어 준비를 취소했습니다.");
    if (this.active.has(track.id))
      throw new AppError("MEDIA_BUSY", "이 영상을 이미 준비하고 있습니다.");
    await mkdir(this.cacheDir, { recursive: true });
    const file = join(this.cacheDir, `${track.id}.loudnorm-v1.mp4`);
    const source = join(this.cacheDir, `${track.id}.mp4`);
    const cached = await stat(file).catch((error: unknown) => {
      if (error instanceof Error && "code" in error && error.code === "ENOENT") return undefined;
      throw error;
    });
    if (cached?.isFile() && cached.size > 0 && cached.size <= LIMIT) {
      this.files.set(track.id, file);
      return file;
    }
    if (track.duration <= 0 || track.duration > 7200)
      throw new AppError("MEDIA_UNSUPPORTED", "2시간 이하의 영상만 재생할 수 있습니다.");
    const entries = await readdir(this.cacheDir, { withFileTypes: true });
    const sizes = await Promise.all(
      entries
        .filter((entry) => entry.isFile())
        .map(async (entry) => (await stat(join(this.cacheDir, entry.name))).size),
    );
    if (sizes.reduce((sum, size) => sum + size, 0) > 2 * LIMIT)
      throw new AppError(
        "MEDIA_CACHE",
        "미디어 캐시가 가득 찼습니다. 앱을 종료한 뒤 캐시를 비워 주세요.",
      );
    this.active.add(track.id);
    try {
      await runMedia(
        this.ytDlpExecutable(),
        [
          ...options,
          "--no-playlist",
          "--no-progress",
          "--max-filesize",
          String(LIMIT),
          "--match-filter",
          "duration <= 7200 & !is_live",
          "-f",
          "bv*[height<=720][vcodec^=avc1]+ba[ext=m4a]/b[ext=mp4]",
          "--merge-output-format",
          "mp4",
          "--ffmpeg-location",
          join(this.toolsDir, "ffmpeg.exe"),
          "-o",
          source,
          "--",
          url,
        ],
        combined,
        15 * 60 * 1000,
      );
      if (combined.aborted) throw new AppError("MEDIA_CANCELLED", "미디어 준비를 취소했습니다.");
      const downloaded = await stat(source);
      if (!downloaded.isFile() || downloaded.size === 0 || downloaded.size > LIMIT)
        throw new AppError("MEDIA_SIZE", "영상 파일이 없거나 1GB 제한을 초과했습니다.");
      await normalizeMedia({
        executable: join(this.toolsDir, "ffmpeg.exe"),
        input: source,
        output: file,
        signal: combined,
      });
      const result = await stat(file);
      if (!result.isFile() || result.size === 0 || result.size > LIMIT)
        throw new AppError("MEDIA_SIZE", "영상 파일이 없거나 1GB 제한을 초과했습니다.");
      await rm(source, { force: true });
      if (combined.aborted) throw new AppError("MEDIA_CANCELLED", "미디어 준비를 취소했습니다.");
      this.files.set(track.id, file);
      return file;
    } catch (error) {
      const partials = (await readdir(this.cacheDir)).filter((name) =>
        name.startsWith(`${track.id}.`),
      );
      await Promise.all(partials.map((name) => rm(join(this.cacheDir, name), { force: true })));
      if (error instanceof AppError) throw error;
      throw new AppError(
        "MEDIA_FILE",
        "영상 파일을 저장하지 못했습니다. 저장 공간을 확인해 주세요.",
      );
    } finally {
      this.active.delete(track.id);
    }
  }
  fileFor(trackId: string): string | undefined {
    return this.files.get(trackId);
  }
  dispose(): void {
    this.lifetime.abort();
    this.files.clear();
  }
}
