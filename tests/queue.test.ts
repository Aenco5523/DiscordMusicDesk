import { expect, it } from "vitest";
import { moveTrack, PlaybackClock, removeTrack } from "../src/main/queue";
import type { Track } from "../src/shared/contracts";

const a: Track = {
  id: "a",
  url: "u",
  title: "a",
  duration: 20,
  addedBy: "PC",
  status: "queued",
  error: null,
};
const b: Track = { ...a, id: "b", title: "b" };
it("reorders stable identities without mutating original", () => {
  const q = [a, b];
  const moved = moveTrack(q, "b", -1);
  expect(moved.map((t) => t.id)).toEqual(["b", "a"]);
  expect(q.map((t) => t.id)).toEqual(["a", "b"]);
});
it("keeps boundary order", () => {
  expect(moveTrack([a, b], "a", -1)).toEqual([a, b]);
});
it("removes only requested identity", () => {
  expect(removeTrack([a, b], "a")).toEqual([b]);
});
it("advances while playing and freezes while paused", () => {
  let now = 1000;
  const clock = new PlaybackClock(() => now);
  clock.start(5);
  now = 3000;
  expect(clock.position).toBe(7);
  clock.pause();
  now = 9000;
  expect(clock.position).toBe(7);
});
it("seek preserves pause state", () => {
  const clock = new PlaybackClock(() => 1000);
  clock.seek(11);
  expect(clock.position).toBe(11);
  expect(clock.playing).toBe(false);
});
it("seek while playing resets anchor", () => {
  let now = 0;
  const clock = new PlaybackClock(() => now);
  clock.start(1);
  now = 2000;
  clock.seek(8);
  now = 3000;
  expect(clock.position).toBe(9);
});
