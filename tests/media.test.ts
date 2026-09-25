import { EventEmitter } from "node:events";
import { mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PassThrough } from "node:stream";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MediaService } from "../src/main/media";
import type { Track } from "../src/shared/contracts";

const fake = vi.hoisted(() => ({ spawn: vi.fn() }));
vi.mock("node:child_process", () => ({ spawn: fake.spawn }));
class Process extends EventEmitter {
  stdout = new PassThrough();
  stderr = new PassThrough();
  pid = 12345;
  kill = vi.fn(() => {
    this.emit("close", 1);
    return true;
  });
}
const track: Track = {
  id: "00000000-0000-4000-8000-000000000001",
  url: "https://www.youtube.com/watch?v=jNQXAC9IVRw",
  title: "Zoo",
  duration: 19,
  addedBy: "test",
  status: "queued",
  error: null,
};
let dir: string;
let service: MediaService;
beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "media-test-"));
  service = new MediaService(dir, dir);
  fake.spawn.mockReset();
});
afterEach(async () => {
  service.dispose();
  await rm(dir, { recursive: true, force: true });
});
function output(value: unknown) {
  fake.spawn.mockImplementation(() => {
    const child = new Process();
    queueMicrotask(() => {
      child.stdout.write(JSON.stringify(value));
      child.emit("close", 0);
    });
    return child;
  });
}
describe("MediaService", () => {
  it("reads flat playlist entries and skips long or live videos", async () => {
    output({
      entries: [
        { id: "jNQXAC9IVRw", title: "First", duration: 19 },
        { id: "BLIWFBjqrQI", title: "Unknown", duration: null },
        { id: "R8un7H0VXPQ", title: "Long", duration: 7201 },
        { id: "2QufxeW8zaU", title: "Live", duration: 100, is_live: true },
      ],
    });
    const entries = await service.playlist(
      "https://www.youtube.com/playlist?list=PL-zl0Qa3WDZ-XYzFHodllO2vHmE7kGODR",
    );
    expect(entries).toEqual([
      { url: "https://www.youtube.com/watch?v=jNQXAC9IVRw", title: "First", duration: 19 },
      { url: "https://www.youtube.com/watch?v=BLIWFBjqrQI", title: "Unknown", duration: 0 },
    ]);
    expect(fake.spawn.mock.calls[0]?.[1]).toContain("--flat-playlist");
  });
  it("returns metadata when a finite non-live video is supplied", async () => {
    // Given
    output({ title: "Zoo", duration: 19, is_live: false });
    // When
    const result = await service.metadata(track.url);
    // Then
    expect(result).toEqual({ title: "Zoo", duration: 19 });
    expect(fake.spawn.mock.calls[0]?.[2]).toMatchObject({ shell: false });
  });
  it.each([
    { title: "Live", duration: 19, is_live: true },
    { title: "Long", duration: 7201 },
    { title: "Unknown", duration: null },
  ])("rejects unsupported metadata %j", async (value) => {
    // Given
    output(value);
    // When / Then
    await expect(service.metadata(track.url)).rejects.toMatchObject({ code: "MEDIA_UNSUPPORTED" });
  });
  it("reuses a prepared file and only exposes registered IDs", async () => {
    // Given
    await writeFile(join(dir, `${track.id}.loudnorm-v1.mp4`), "video");
    // When
    const path = await service.prepare(track, new AbortController().signal);
    // Then
    expect(path).toBe(join(dir, `${track.id}.loudnorm-v1.mp4`));
    expect(service.fileFor(track.id)).toBe(path);
    expect(service.fileFor("../secret")).toBeUndefined();
    expect(fake.spawn).not.toHaveBeenCalled();
  });
  it("removes partial output when downloading is cancelled", async () => {
    // Given
    const controller = new AbortController();
    fake.spawn.mockImplementation((exe: string) => {
      const child = new Process();
      if (exe.endsWith("taskkill.exe")) queueMicrotask(() => child.emit("close", 0));
      else queueMicrotask(() => controller.abort());
      return child;
    });
    await writeFile(join(dir, `${track.id}.mp4.part`), "partial");
    // When / Then
    await expect(service.prepare(track, controller.signal)).rejects.toMatchObject({
      code: "MEDIA_CANCELLED",
    });
    expect(await readdir(dir)).toEqual([]);
    expect(service.fileFor(track.id)).toBeUndefined();
  });
});

it("normalizes an old cached download before registering the new version", async () => {
  // Given
  await writeFile(join(dir, `${track.id}.mp4`), "old video");
  fake.spawn.mockImplementation((exe: string, args: string[]) => {
    const child = new Process();
    queueMicrotask(async () => {
      if (exe.endsWith("yt-dlp.exe")) {
        child.emit("close", 0);
        return;
      }
      if (args.includes("null"))
        child.stderr.write(
          JSON.stringify({
            input_i: "-25",
            input_tp: "-20",
            input_lra: "0",
            input_thresh: "-35",
            target_offset: "0",
          }),
        );
      else {
        const destination = args.at(-1);
        if (destination) await writeFile(destination, "normalized video");
      }
      child.emit("close", 0);
    });
    return child;
  });
  // When
  const path = await service.prepare(track, new AbortController().signal);
  // Then
  expect(path).toBe(join(dir, `${track.id}.loudnorm-v1.mp4`));
  expect(service.fileFor(track.id)).toBe(path);
  expect(
    fake.spawn.mock.calls.filter((call) => String(call[0]).endsWith("ffmpeg.exe")),
  ).toHaveLength(2);
  expect(await readdir(dir)).toEqual([`${track.id}.loudnorm-v1.mp4`]);
});
it("cleans normalization output and never registers it when cancelled", async () => {
  // Given
  const controller = new AbortController();
  await writeFile(join(dir, `${track.id}.mp4`), "old video");
  fake.spawn.mockImplementation((exe: string, args: string[]) => {
    const child = new Process();
    queueMicrotask(async () => {
      if (exe.endsWith("ffmpeg.exe") && !args.includes("null")) {
        const destination = args.at(-1);
        if (destination) await writeFile(destination, "partial normalized video");
        controller.abort();
      } else {
        if (args.includes("null"))
          child.stderr.write(
            JSON.stringify({
              input_i: "-25",
              input_tp: "-20",
              input_lra: "0",
              input_thresh: "-35",
              target_offset: "0",
            }),
          );
        child.emit("close", 0);
      }
    });
    return child;
  });
  // When / Then
  await expect(service.prepare(track, controller.signal)).rejects.toMatchObject({
    code: "MEDIA_CANCELLED",
  });
  expect(await readdir(dir)).toEqual([]);
  expect(service.fileFor(track.id)).toBeUndefined();
});
