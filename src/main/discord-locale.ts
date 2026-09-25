import { SlashCommandBuilder } from "discord.js";
import type { Locale } from "../shared/contracts";
import { AppError } from "../shared/contracts";

type ReplyKey =
  | "voiceRequired"
  | "channelChanged"
  | "added"
  | "addedChanged"
  | "invalidUrl"
  | "queueFull"
  | "addFailed";

const replies: Record<Locale, Record<ReplyKey, string>> = {
  ko: {
    voiceRequired: "봇과 같은 음성 채널에 참가한 뒤 사용해 주세요.",
    channelChanged: "음성 채널이 변경되었습니다. 다시 시도해 주세요.",
    added: "재생 대기열에 추가했습니다.",
    addedChanged: "재생 대기열에 추가했습니다. 현재 음성 채널이 변경되었습니다.",
    invalidUrl: "올바른 YouTube 영상 또는 재생목록 URL을 입력해 주세요.",
    queueFull: "재생목록은 최대 200곡까지 추가할 수 있습니다.",
    addFailed: "영상을 추가하지 못했습니다. 잠시 후 다시 시도해 주세요.",
  },
  en: {
    voiceRequired: "Join the same voice channel as the bot first.",
    channelChanged: "The voice channel changed. Please try again.",
    added: "Added to the queue.",
    addedChanged: "Added to the queue, but the voice channel changed.",
    invalidUrl: "Enter a valid YouTube video or playlist URL.",
    queueFull: "The queue can contain up to 200 tracks.",
    addFailed: "Could not add the video. Please try again shortly.",
  },
  ja: {
    voiceRequired: "先にBotと同じボイスチャンネルに参加してください。",
    channelChanged: "ボイスチャンネルが変わりました。もう一度お試しください。",
    added: "再生リストに追加しました。",
    addedChanged: "再生リストに追加しましたが、ボイスチャンネルが変わりました。",
    invalidUrl: "有効なYouTube動画または再生リストのURLを入力してください。",
    queueFull: "再生リストには最大200曲まで追加できます。",
    addFailed: "動画を追加できません。しばらくしてから再試行してください。",
  },
  "zh-CN": {
    voiceRequired: "请先加入与机器人相同的语音频道。",
    channelChanged: "语音频道已变化，请重试。",
    added: "已添加到播放列表。",
    addedChanged: "已添加到播放列表，但语音频道已变化。",
    invalidUrl: "请输入有效的 YouTube 视频或播放列表链接。",
    queueFull: "播放列表最多可添加 200 首曲目。",
    addFailed: "无法添加视频，请稍后重试。",
  },
};

export function discordLocale(value: string): Locale {
  if (value.startsWith("ko")) return "ko";
  if (value.startsWith("ja")) return "ja";
  if (value === "zh-CN") return "zh-CN";
  return "en";
}

export function discordReply(locale: string, key: ReplyKey): string {
  return replies[discordLocale(locale)][key];
}

export function discordError(locale: string, error: unknown): string {
  if (error instanceof AppError) {
    if (error.code === "URL") return discordReply(locale, "invalidUrl");
    if (error.code === "QUEUE_FULL") return discordReply(locale, "queueFull");
    if (error.code === "VOICE_AUTH") return discordReply(locale, "voiceRequired");
  }
  return discordReply(locale, "addFailed");
}

export function addVideoCommand() {
  return new SlashCommandBuilder()
    .setName("영상추가")
    .setNameLocalizations({
      "en-US": "add-video",
      "en-GB": "add-video",
      ja: "動画追加",
      "zh-CN": "添加视频",
    })
    .setDescription("현재 음성 채널의 재생 대기열에 YouTube 영상 또는 재생목록을 추가합니다.")
    .setDescriptionLocalizations({
      "en-US": "Add a YouTube video or playlist to the current voice channel queue",
      "en-GB": "Add a YouTube video or playlist to the current voice channel queue",
      ja: "現在のボイスチャンネルの再生リストにYouTube動画または再生リストを追加",
      "zh-CN": "将 YouTube 视频或播放列表添加到当前语音频道的播放列表",
    })
    .addStringOption((option) =>
      option
        .setName("url")
        .setDescription("YouTube 영상 또는 재생목록 주소")
        .setDescriptionLocalizations({
          "en-US": "YouTube video or playlist URL",
          "en-GB": "YouTube video or playlist URL",
          ja: "YouTube動画または再生リストのURL",
          "zh-CN": "YouTube 视频或播放列表链接",
        })
        .setRequired(true),
    );
}
