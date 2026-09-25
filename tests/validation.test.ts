import { describe, expect, it } from "vitest";
import { commandSchema } from "../src/shared/contracts";
import { mayAddFromVoice, youtubeInput, youtubeUrl } from "../src/shared/validation";

describe("YouTube boundary", () => {
  it("canonicalizes share URL and removes tracking", () => {
    const input = "https://youtu.be/jNQXAC9IVRw?si=abc";
    const actual = youtubeUrl(input);
    expect(actual).toBe("https://www.youtube.com/watch?v=jNQXAC9IVRw");
  });
  it("accepts playlist and watch-with-list links as a playlist", () => {
    const list = "PL-zl0Qa3WDZ-XYzFHodllO2vHmE7kGODR";
    expect(youtubeInput(`https://music.youtube.com/playlist?list=${list}&si=abc`)).toEqual({
      kind: "playlist",
      url: `https://www.youtube.com/playlist?list=${list}`,
    });
    expect(youtubeInput(`https://www.youtube.com/watch?v=jNQXAC9IVRw&list=${list}`)).toEqual({
      kind: "playlist",
      url: `https://www.youtube.com/playlist?list=${list}`,
    });
  });
  it("rejects invalid playlist ids", () => {
    expect(() => youtubeInput("https://www.youtube.com/playlist?list=bad")).toThrow();
  });
  it.each([
    "file:///C:/private",
    "https://youtube.com.evil.test/watch?v=jNQXAC9IVRw",
    "https://localhost/watch?v=jNQXAC9IVRw",
    "https://user:pass@youtube.com/watch?v=jNQXAC9IVRw",
    "https://www.youtube.com/playlist?list=test",
    "http://youtube.com/watch?v=jNQXAC9IVRw",
  ])("rejects unsafe input %s", (input) => {
    expect(() => youtubeUrl(input)).toThrow();
  });
  it("rejects nonfinite seek and invalid volume", () => {
    expect(commandSchema.safeParse({ type: "seek", position: Infinity }).success).toBe(false);
    expect(commandSchema.safeParse({ type: "volume", target: "pc", value: 101 }).success).toBe(
      false,
    );
  });
});
describe("voice participant permission", () => {
  it("rejects other voice channel", () => {
    expect(
      mayAddFromVoice({ guildId: "g", channelId: "other" }, { guildId: "g", channelId: "voice" }),
    ).toBe(false);
  });
  it("rejects disconnected member", () => {
    expect(
      mayAddFromVoice({ guildId: "g", channelId: null }, { guildId: "g", channelId: null }),
    ).toBe(false);
  });
  it("rejects different guild", () => {
    expect(
      mayAddFromVoice({ guildId: "other", channelId: "v" }, { guildId: "g", channelId: "v" }),
    ).toBe(false);
  });
  it("accepts participant in bot voice channel", () => {
    expect(
      mayAddFromVoice({ guildId: "g", channelId: "v" }, { guildId: "g", channelId: "v" }),
    ).toBe(true);
  });
});
