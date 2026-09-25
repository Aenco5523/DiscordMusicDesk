import { expect, it } from "vitest";
import { localeFromInstaller, localeFromSystem } from "../src/shared/locale";

it("uses installer language names only for supported first-launch locales", () => {
  expect(localeFromInstaller("korean")).toBe("ko");
  expect(localeFromInstaller("chinesesimplified")).toBe("zh-CN");
  expect(localeFromInstaller("japanese")).toBe("ja");
  expect(localeFromInstaller("english")).toBe("en");
  expect(localeFromInstaller("other")).toBeNull();
});

it("recognizes Windows language tags and falls back to Korean", () => {
  expect(localeFromSystem("en-US")).toBe("en");
  expect(localeFromSystem("ja-JP")).toBe("ja");
  expect(localeFromSystem("zh-Hans")).toBe("zh-CN");
  expect(localeFromSystem("zh-TW")).toBe("ko");
});
