import { spawnSync } from "node:child_process";
import { mkdtemp, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { normalizeMedia } from "../src/main/media-normalize";

const executable = resolve("vendor/ffmpeg.exe");
let dir: string;
function ffmpeg(args: readonly string[]): Readonly<{ stdout: string; stderr: string }> {
  const result = spawnSync(executable, ["-hide_banner", "-nostdin", ...args], {
    encoding: "utf8",
    windowsHide: true,
    timeout: 30000,
    maxBuffer: 4 * 1024 * 1024,
  });
  if (result.error) throw result.error;
  expect(result.status, result.stderr).toBe(0);
  return { stdout: result.stdout, stderr: result.stderr };
}
function loudness(file: string): number {
  const result = ffmpeg([
    "-i",
    file,
    "-af",
    "loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json",
    "-f",
    "null",
    "-",
  ]);
  const value = result.stderr.match(/"input_i"\s*:\s*"([^"]+)"/u)?.[1];
  return value === "-inf" ? Number.NEGATIVE_INFINITY : Number(value);
}
function videoHash(file: string): string {
  return ffmpeg(["-i", file, "-map", "0:v:0", "-c:v", "copy", "-f", "hash", "-hash", "sha256", "-"])
    .stdout;
}
beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), "loudness-test-"));
  for (const [name, volume] of [
    ["quiet", "0.1"],
    ["loud", "1"],
    ["silence", "0"],
  ] as const) {
    ffmpeg([
      "-y",
      "-f",
      "lavfi",
      "-i",
      "testsrc2=size=64x64:rate=10",
      "-f",
      "lavfi",
      "-i",
      "sine=frequency=440:sample_rate=48000",
      "-t",
      "4",
      "-af",
      `volume=${volume}`,
      "-c:v",
      "libx264",
      "-c:a",
      "aac",
      join(dir, `${name}.mp4`),
    ]);
  }
}, 30000);
afterAll(async () => {
  await rm(dir, { recursive: true, force: true });
});
describe("real FFmpeg normalization", () => {
  it("narrows loud and quiet songs to the same loudness while copying video", async () => {
    // Given
    const quiet = join(dir, "quiet.mp4");
    const loud = join(dir, "loud.mp4");
    expect(Math.abs(loudness(quiet) - loudness(loud))).toBeGreaterThan(15);
    // When
    for (const name of ["quiet", "loud"])
      await normalizeMedia({
        executable,
        input: join(dir, `${name}.mp4`),
        output: join(dir, `${name}.normalized.mp4`),
        signal: new AbortController().signal,
      });
    // Then
    const q = join(dir, "quiet.normalized.mp4");
    const l = join(dir, "loud.normalized.mp4");
    expect(Math.abs(loudness(q) - loudness(l))).toBeLessThan(1);
    expect(loudness(q)).toBeCloseTo(-16, 0);
    expect(videoHash(q)).toBe(videoHash(quiet));
    expect(videoHash(l)).toBe(videoHash(loud));
  }, 30000);
  it("keeps silent audio silent when loudness is nonfinite", async () => {
    // Given
    const output = join(dir, "silence.normalized.mp4");
    // When
    await normalizeMedia({
      executable,
      input: join(dir, "silence.mp4"),
      output,
      signal: new AbortController().signal,
    });
    // Then
    expect(loudness(output)).toBe(Number.NEGATIVE_INFINITY);
  }, 30000);
  it("does not publish output when cancelled", async () => {
    // Given
    const controller = new AbortController();
    controller.abort();
    const output = join(dir, "cancelled.mp4");
    // When / Then
    await expect(
      normalizeMedia({
        executable,
        input: join(dir, "quiet.mp4"),
        output,
        signal: controller.signal,
      }),
    ).rejects.toMatchObject({ code: "MEDIA_CANCELLED" });
    await expect(stat(output)).rejects.toMatchObject({ code: "ENOENT" });
  });
});
