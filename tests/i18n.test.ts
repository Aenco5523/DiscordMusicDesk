import { expect, it } from "vitest";
import { translate } from "../src/renderer/i18n";
import { localizeRuntime } from "../src/renderer/i18n/runtime";

it("uses the selected language for dynamic track labels", () => {
  expect(translate("en", "queue.play", { title: "Moonlight" })).toBe("Play Moonlight");
  expect(translate("ja", "queue.play", { title: "Moonlight" })).toBe("Moonlightを再生");
  expect(translate("zh-CN", "queue.play", { title: "Moonlight" })).toBe("播放 Moonlight");
});

it("preserves actionable runtime errors and avoids Korean fallback in other locales", () => {
  const source = "봇에 이 음성 채널의 연결 및 말하기 권한이 필요합니다.";
  expect(localizeRuntime("en", source)).toContain("permission");
  expect(localizeRuntime("ja", source)).toContain("権限");
  expect(localizeRuntime("zh-CN", source)).toContain("权限");
  expect(localizeRuntime("en", "알 수 없는 새 오류")).not.toMatch(/[가-힣]/);
  expect(localizeRuntime("ko", source)).toBe(source);
});
