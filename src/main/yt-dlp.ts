import { existsSync } from "node:fs";
import { copyFile, mkdir, rename, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { AppError } from "../shared/contracts";
import { runMedia } from "./media-process";

type Runner = (executable: string, args: readonly string[]) => Promise<string>;
const defaultRunner: Runner = (executable, args) =>
  runMedia(executable, args, new AbortController().signal, 180000);

function releaseVersion(output: string): string {
  const version = output.trim();
  if (!/^\d{4}\.\d{2}\.\d{2}$/.test(version))
    throw new AppError("YTDLP_VERSION", "yt-dlp 버전을 확인하지 못했습니다.");
  return version;
}

export class YtDlpManager {
  private readonly updatedPath: string;
  private readonly stagedPath: string;
  private readonly previousPath: string;
  private updating = false;

  constructor(
    private readonly bundledPath: string,
    userDataDir: string,
    private readonly run: Runner = defaultRunner,
  ) {
    const toolsDir = join(userDataDir, "tools");
    this.updatedPath = join(toolsDir, "yt-dlp.exe");
    this.stagedPath = join(toolsDir, "staging", "yt-dlp.exe");
    this.previousPath = join(toolsDir, "yt-dlp.previous.exe");
  }

  executable(): string {
    return existsSync(this.updatedPath) ? this.updatedPath : this.bundledPath;
  }

  async version(): Promise<string> {
    return releaseVersion(await this.run(this.executable(), ["--version"]));
  }

  async update(): Promise<{ version: string; updated: boolean }> {
    if (this.updating) throw new AppError("YTDLP_BUSY", "yt-dlp 업데이트가 이미 진행 중입니다.");
    this.updating = true;
    try {
      const current = await this.version();
      await mkdir(dirname(this.stagedPath), { recursive: true });
      await copyFile(this.executable(), this.stagedPath);
      await this.run(this.stagedPath, ["--ignore-config", "-U"]);
      const next = releaseVersion(await this.run(this.stagedPath, ["--version"]));
      if (next < current) throw new AppError("YTDLP_VERSION", "이전 버전으로 변경하지 않았습니다.");
      if (next === current) return { version: current, updated: false };

      const hadUpdate = existsSync(this.updatedPath);
      if (hadUpdate) {
        await rm(this.previousPath, { force: true });
        await rename(this.updatedPath, this.previousPath);
      }
      try {
        await rename(this.stagedPath, this.updatedPath);
      } catch (error) {
        if (hadUpdate) await rename(this.previousPath, this.updatedPath);
        throw error;
      }
      if (hadUpdate) await rm(this.previousPath, { force: true });
      return { version: next, updated: true };
    } catch {
      throw new AppError(
        "YTDLP_UPDATE",
        "yt-dlp 업데이트에 실패했습니다. 인터넷 연결을 확인해 주세요.",
      );
    } finally {
      try {
        await rm(dirname(this.stagedPath), { recursive: true, force: true });
      } finally {
        this.updating = false;
      }
    }
  }
}
