import type { Locale } from "./contracts";

export function localeFromSystem(value: string): Locale {
  const lower = value.toLowerCase();
  if (lower.startsWith("ko")) return "ko";
  if (lower.startsWith("ja")) return "ja";
  if (lower === "zh-cn" || lower === "zh-sg" || lower === "zh-hans") return "zh-CN";
  if (lower.startsWith("en")) return "en";
  return "ko";
}

export function localeFromInstaller(value: string | undefined): Locale | null {
  switch (value?.toLowerCase()) {
    case "korean":
      return "ko";
    case "chinesesimplified":
      return "zh-CN";
    case "japanese":
      return "ja";
    case "english":
      return "en";
    default:
      return null;
  }
}
