import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, expect, it } from "vitest";
import type { MediaPort, VoicePort } from "../src/main/controller";
import { Controller } from "../src/main/controller";
import { Storage } from "../src/main/storage";

const dirs: string[] = [];
const controllers: Controller[] = [];
afterEach(() => {
  for (const c of controllers.splice(0)) c.dispose();
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
});
function setup() {
  const dir = mkdtempSync(join(tmpdir(), "music-controller-"));
  dirs.push(dir);
  const storage = new Storage(dir, {
    isEncryptionAvailable: () => true,
    encryptString: (s) => Buffer.from(s),
    decryptString: (b) => b.toString(),
  });
  const media: MediaPort = {
    metadata: async () => ({ title: "Zoo", duration: 19 }),
    playlist: async () => [],
    prepare: async () => "/fixture.mp4",
    fileFor: () => "/fixture.mp4",
    dispose: () => {},
  };
  const voice: VoicePort = {
    connect: async () => {},
    join: async () => {},
    leave: () => {},
    play: () => {},
    pause: () => {},
    resume: () => {},
    setVolume: () => {},
    stopAudio: () => {},
    dispose: () => {},
  };
  const c = new Controller({ storage, media, voice, publish: () => {} });
  controllers.push(c);
  return { c, media };
}
it("adds real metadata without autoplay", async () => {
  const { c } = setup();
  await c.add("https://youtu.be/jNQXAC9IVRw", "PC");
  expect(c.snapshot().queue[0]?.title).toBe("Zoo");
  expect(c.snapshot().playback.status).toBe("idle");
});
it("adds playlist entries in order and resolves unknown duration on selection", async () => {
  const { c, media } = setup();
  media.playlist = async () => [
    { url: "https://www.youtube.com/watch?v=jNQXAC9IVRw", title: "First", duration: 19 },
    { url: "https://www.youtube.com/watch?v=BLIWFBjqrQI", title: "Second", duration: 0 },
  ];
  await c.add("https://www.youtube.com/playlist?list=PL-zl0Qa3WDZ-XYzFHodllO2vHmE7kGODR", "PC");
  expect(c.snapshot().queue.map((t) => t.title)).toEqual(["First", "Second"]);
  expect(c.snapshot().playback.status).toBe("idle");
  const id = c.snapshot().queue[1]?.id;
  if (!id) throw new Error("missing fixture");
  await c.command({ type: "select", id });
  expect(c.snapshot().queue[1]?.duration).toBe(19);
  expect(c.snapshot().playback.status).toBe("playing");
});
it("rejects an overfull playlist without changing the queue", async () => {
  const { c, media } = setup();
  media.playlist = async () =>
    Array.from({ length: 201 }, (_, index) => ({
      url: "https://www.youtube.com/watch?v=jNQXAC9IVRw",
      title: String(index),
      duration: 19,
    }));
  await expect(
    c.add("https://www.youtube.com/playlist?list=PL-zl0Qa3WDZ-XYzFHodllO2vHmE7kGODR", "PC"),
  ).rejects.toThrow();
  expect(c.snapshot().queue).toHaveLength(0);
});
it("separate volumes do not overwrite one another", async () => {
  const { c } = setup();
  await c.command({ type: "volume", target: "pc", value: 22 });
  expect(c.snapshot().settings.pcVolume).toBe(22);
  expect(c.snapshot().settings.discordVolume).toBe(70);
});
it("select prepare pause seek share same state", async () => {
  const { c } = setup();
  await c.add("https://youtu.be/jNQXAC9IVRw", "PC");
  const id = c.snapshot().queue[0]?.id;
  if (!id) throw new Error("missing fixture");
  await c.command({ type: "select", id });
  expect(c.snapshot().playback.status).toBe("playing");
  await c.command({ type: "toggle" });
  await c.command({ type: "seek", position: 7 });
  expect(c.snapshot().playback.status).toBe("paused");
  expect(c.snapshot().playback.position).toBe(7);
});
it("removed preparing track cannot resurrect after late completion", async () => {
  const { c, media } = setup();
  await c.add("https://youtu.be/jNQXAC9IVRw", "PC");
  const id = c.snapshot().queue[0]?.id;
  if (!id) throw new Error("missing fixture");
  let resolve: (s: string) => void = () => {};
  media.prepare = () =>
    new Promise((r) => {
      resolve = r;
    });
  const pending = c.command({ type: "select", id });
  await c.command({ type: "remove", id });
  resolve("/fixture.mp4");
  await pending;
  expect(c.snapshot().queue).toHaveLength(0);
  expect(c.snapshot().playback.trackId).toBe(null);
  expect(c.snapshot().playback.status).toBe("idle");
});
it("rejects permission revoked during metadata resolution", async () => {
  const { c, media } = setup();
  let permitted = true;
  media.metadata = async () => {
    permitted = false;
    return { title: "Zoo", duration: 19 };
  };
  await expect(c.add("https://youtu.be/jNQXAC9IVRw", "member", () => permitted)).rejects.toThrow();
  expect(c.snapshot().queue).toHaveLength(0);
});
