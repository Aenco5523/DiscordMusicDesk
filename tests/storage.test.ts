import { createCipheriv, createDecipheriv } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, expect, it } from "vitest";
import { Storage } from "../src/main/storage";

const dirs: string[] = [];
const crypto = {
  isEncryptionAvailable: () => true,
  encryptString: (s: string) => {
    const c = createCipheriv("aes-256-ctr", Buffer.alloc(32, 7), Buffer.alloc(16));
    return Buffer.concat([c.update(s), c.final()]);
  },
  decryptString: (b: Buffer) => {
    const c = createDecipheriv("aes-256-ctr", Buffer.alloc(32, 7), Buffer.alloc(16));
    return Buffer.concat([c.update(b), c.final()]).toString();
  },
};
function fresh() {
  const p = mkdtempSync(join(tmpdir(), "music-storage-"));
  dirs.push(p);
  return p;
}
afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
});
it("stores ciphertext and restores token", () => {
  const p = fresh();
  const s = new Storage(p, crypto);
  s.saveToken("secret-bot-token-test");
  expect(s.token()).toBe("secret-bot-token-test");
  expect(readFileSync(join(p, "token.bin")).includes("secret-bot-token-test")).toBe(false);
});
it("refuses plaintext fallback when crypto unavailable", () => {
  const s = new Storage(fresh(), { ...crypto, isEncryptionAvailable: () => false });
  expect(() => s.saveToken("secret-bot-token-test")).toThrow();
});
it("restores queue identities and volumes", () => {
  const p = fresh();
  const s = new Storage(p, crypto);
  s.save({ pcVolume: 31, discordVolume: 82, channelId: "123" }, [
    {
      id: "550e8400-e29b-41d4-a716-446655440000",
      url: "https://youtu.be/jNQXAC9IVRw",
      title: "zoo",
      duration: 19,
      addedBy: "PC",
      status: "ready",
      error: null,
    },
  ]);
  const saved = new Storage(p, crypto).load();
  expect(saved.settings.pcVolume).toBe(31);
  expect(saved.queue[0]?.id).toBe("550e8400-e29b-41d4-a716-446655440000");
  expect(saved.queue[0]?.status).toBe("queued");
});
it("preserves corrupt original and reports it", () => {
  const p = fresh();
  writeFileSync(join(p, "state.json"), "{invalid");
  const s = new Storage(p, crypto);
  expect(s.load().notice).toBeTruthy();
  expect(readFileSync(join(p, "state.json"), "utf8")).toBe("{invalid");
});
