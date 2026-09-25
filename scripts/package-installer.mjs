import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const version = JSON.parse(readFileSync(join(root, "package.json"), "utf8")).version;
const source = join(root, "release", "installer", "win-unpacked");
const script = join(root, "installer", "music-desk.iss");
for (const file of [
  "Music Desk.exe",
  join("resources", "tools", "ffmpeg.exe"),
  join("resources", "tools", "yt-dlp.exe"),
  join("resources", "LICENSE.txt"),
]) {
  if (!existsSync(join(source, file))) throw new Error("Missing installer input: " + file);
}

const candidates = [
  process.env.INNO_SETUP_ISCC,
  join(process.env.LOCALAPPDATA ?? "", "Programs", "Inno Setup 6", "ISCC.exe"),
  "C:\Program Files (x86)\Inno Setup 6\ISCC.exe",
  "C:\Program Files\Inno Setup 6\ISCC.exe",
  join(
    process.env.LOCALAPPDATA ?? "",
    "Programs",
    "Antigravity IDE",
    "resources",
    "app",
    "node_modules",
    "innosetup",
    "bin",
    "ISCC.exe",
  ),
].filter((value) => typeof value === "string");
const iscc = candidates.find((value) => existsSync(value));
if (!iscc) throw new Error("Inno Setup 6 ISCC.exe not found; set INNO_SETUP_ISCC.");

const result = spawnSync(iscc, ["/DAppVersion=" + version, "/DSourceDir=" + source, script], {
  cwd: root,
  stdio: "inherit",
  windowsHide: true,
});
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);
