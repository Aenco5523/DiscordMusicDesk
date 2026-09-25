import { expect, it } from "vitest";
import { addVideoCommand, discordError, discordReply } from "../src/main/discord-locale";
import { AppError } from "../src/shared/contracts";

it("keeps the Korean slash command while providing localized names and descriptions", () => {
  const command = addVideoCommand().toJSON();
  expect(command.name).toBe("영상추가");
  expect(command.name_localizations?.["en-US"]).toBe("add-video");
  expect(command.name_localizations?.ja).toBe("動画追加");
  expect(command.name_localizations?.["zh-CN"]).toBe("添加视频");
  expect(command.options?.[0]?.name).toBe("url");
  expect(command.options?.[0]?.description_localizations?.["zh-CN"]).toContain("链接");
});

it("uses the Discord member's locale for replies and validation errors", () => {
  expect(discordReply("en-US", "added")).toBe("Added to the queue.");
  expect(discordReply("ja", "voiceRequired")).toContain("ボイスチャンネル");
  expect(discordError("zh-CN", new AppError("URL", "한국어 오류"))).toContain("YouTube");
  expect(discordError("en-US", new Error("secret"))).not.toContain("secret");
});
