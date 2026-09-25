import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, expect, it } from "vitest";
import { YtDlpManager } from "../src/main/yt-dlp";

const dirs: string[] = [];
function fixture() {
  const root = mkdtempSync(join(tmpdir(), "music-yt-dlp-"));
  dirs.push(root);
  const bundledDir = join(root, "bundle");
  mkdirSync(bundledDir);
  const bundled = join(bundledDir, "yt-dlp.exe");
  writeFileSync(bundled, "2026.08.19");
  return { root, bundled };
}
afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

it("updates only the per-user executable and leaves the bundle intact", async () => {
  const { root, bundled } = fixture();
  const manager = new YtDlpManager(bundled, root, async (executable, args) => {
    if (args.includes("-U")) {
      writeFileSync(executable, "2026.10.01");
      return "updated";
    }
    return readFileSync(executable, "utf8");
  });
  expect(manager.executable()).toBe(bundled);
  expect(await manager.update()).toEqual({ version: "2026.10.01", updated: true });
  expect(readFileSync(bundled, "utf8")).toBe("2026.08.19");
  expect(manager.executable()).toBe(join(root, "tools", "yt-dlp.exe"));
  expect(await manager.version()).toBe("2026.10.01");
});

it("keeps the bundled executable when the update fails", async () => {
  const { root, bundled } = fixture();
  const manager = new YtDlpManager(bundled, root, async (executable, args) => {
    if (args.includes("-U")) throw new Error("network unavailable");
    return readFileSync(executable, "utf8");
  });
  await expect(manager.update()).rejects.toThrow("yt-dlp 업데이트에 실패했습니다.");
  expect(manager.executable()).toBe(bundled);
  expect(existsSync(join(root, "tools", "yt-dlp.exe"))).toBe(false);
  expect(existsSync(join(root, "tools", "staging"))).toBe(false);
});

it("does not create a user override when stable is already current", async () => {
  const { root, bundled } = fixture();
  const manager = new YtDlpManager(bundled, root, async (executable) =>
    readFileSync(executable, "utf8"),
  );
  expect(await manager.update()).toEqual({ version: "2026.08.19", updated: false });
  expect(manager.executable()).toBe(bundled);
});
