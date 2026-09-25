import type { Locale } from "../../shared/contracts";
import { en } from "./en";
import { ja } from "./ja";
import { ko } from "./ko";
import { zhCN } from "./zh-CN";

export type TranslationKey = keyof typeof ko;
const dictionaries: Record<Locale, Record<TranslationKey, string>> = {
  ko,
  "zh-CN": zhCN,
  ja,
  en,
};

export const languageOptions: ReadonlyArray<Readonly<{ value: Locale; label: string }>> = [
  { value: "ko", label: "한국어" },
  { value: "zh-CN", label: "简体中文" },
  { value: "ja", label: "日本語" },
  { value: "en", label: "English" },
];

export function translate(
  locale: Locale,
  key: TranslationKey,
  values: Readonly<Record<string, string | number>> = {},
): string {
  let message = dictionaries[locale][key];
  for (const [name, value] of Object.entries(values))
    message = message.replaceAll(`{${name}}`, String(value));
  return message;
}

export function translator(locale: Locale) {
  return (key: TranslationKey, values?: Readonly<Record<string, string | number>>) =>
    translate(locale, key, values);
}
