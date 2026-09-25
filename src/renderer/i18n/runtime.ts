import type { Locale } from "../../shared/contracts";

const entries: ReadonlyArray<readonly [string, string, string, string]> = [
  [
    "올바른 YouTube 영상 URL을 입력해 주세요.",
    "Enter a valid YouTube video URL.",
    "有効なYouTube動画のURLを入力してください。",
    "请输入有效的 YouTube 视频链接。",
  ],
  [
    "https:// YouTube 영상 주소만 사용할 수 있습니다.",
    "Only HTTPS YouTube video URLs are allowed.",
    "HTTPSのYouTube動画URLのみ使用できます。",
    "只能使用 HTTPS YouTube 视频链接。",
  ],
  [
    "YouTube 영상 주소만 추가할 수 있습니다.",
    "Only YouTube video URLs can be added.",
    "YouTube動画のURLのみ追加できます。",
    "只能添加 YouTube 视频链接。",
  ],
  [
    "재생목록이 아닌 개별 YouTube 영상 URL을 입력해 주세요.",
    "Enter a single YouTube video URL, not a playlist.",
    "再生リストではなく、個別のYouTube動画URLを入力してください。",
    "请输入单个 YouTube 视频链接，不要输入播放列表。",
  ],
  [
    "올바른 YouTube 영상 또는 재생목록 URL을 입력해 주세요.",
    "Enter a valid YouTube video or playlist URL.",
    "有効なYouTube動画または再生リストのURLを入力してください。",
    "请输入有效的 YouTube 视频或播放列表链接。",
  ],
  [
    "https:// YouTube 주소만 사용할 수 있습니다.",
    "Only HTTPS YouTube URLs are allowed.",
    "HTTPSのYouTube URLのみ使用できます。",
    "只能使用 HTTPS YouTube 链接。",
  ],
  [
    "올바른 YouTube 재생목록 URL을 입력해 주세요.",
    "Enter a valid YouTube playlist URL.",
    "有効なYouTube再生リストのURLを入力してください。",
    "请输入有效的 YouTube 播放列表链接。",
  ],
  [
    "입력값을 확인해 주세요. 채널 ID는 17~20자리 숫자여야 합니다.",
    "Check your input. A channel ID must contain 17–20 digits.",
    "入力を確認してください。チャンネルIDは17～20桁の数字です。",
    "请检查输入。频道 ID 必须是 17～20 位数字。",
  ],
  [
    "작업을 완료하지 못했습니다. 연결 상태와 설정을 확인한 뒤 다시 시도해 주세요.",
    "Could not complete the action. Check the connection and settings, then try again.",
    "操作を完了できません。接続と設定を確認して再試行してください。",
    "无法完成操作。请检查连接和设置后重试。",
  ],
  [
    "봇 토큰을 암호화하여 저장했습니다. 봇 연결을 눌러 주세요.",
    "Bot token saved securely. Select Connect to Discord.",
    "Botトークンを暗号化して保存しました。Discordに接続してください。",
    "机器人令牌已加密保存。请选择连接 Discord。",
  ],
  [
    "저장된 봇 토큰을 삭제했습니다.",
    "Saved bot token deleted.",
    "保存済みのBotトークンを削除しました。",
    "已删除保存的机器人令牌。",
  ],
  [
    "재생목록은 최대 200곡까지 추가할 수 있습니다.",
    "The queue can contain up to 200 tracks.",
    "再生リストには最大200曲まで追加できます。",
    "播放列表最多可添加 200 首曲目。",
  ],
  [
    "한 번에 최대 200곡까지 추가할 수 있습니다.",
    "You can add up to 200 tracks at once.",
    "一度に追加できるのは最大200曲です。",
    "一次最多可添加 200 首曲目。",
  ],
  [
    "봇과 같은 음성방에 참가해야 영상을 추가할 수 있습니다.",
    "Join the same voice channel as the bot to add videos.",
    "動画を追加するにはBotと同じボイスチャンネルに参加してください。",
    "请加入与机器人相同的语音频道后再添加视频。",
  ],
  [
    "음성방 참가 상태가 변경되어 추가하지 않았습니다.",
    "The voice channel changed, so the video was not added.",
    "ボイスチャンネルの参加状態が変わったため追加しませんでした。",
    "语音频道状态已变化，因此未添加视频。",
  ],
  [
    "설정에서 봇 토큰을 먼저 저장해 주세요.",
    "Save a bot token in Settings first.",
    "先に設定でBotトークンを保存してください。",
    "请先在设置中保存机器人令牌。",
  ],
  [
    "봇에 연결 중입니다. 잠시 기다려 주세요.",
    "The bot is connecting. Please wait.",
    "Botに接続中です。しばらくお待ちください。",
    "机器人正在连接，请稍候。",
  ],
  [
    "재생목록에서 곡을 찾을 수 없습니다.",
    "Track not found in the queue.",
    "再生リストに曲が見つかりません。",
    "播放列表中找不到该曲目。",
  ],
  [
    "저장된 설정을 읽지 못했습니다. 원본을 보존하고 기본 설정으로 시작합니다.",
    "Could not read saved settings. The original was preserved and defaults were loaded.",
    "保存済み設定を読み込めません。元のファイルを保持し、初期設定で起動します。",
    "无法读取已保存的设置。原文件已保留，将使用默认设置启动。",
  ],
  [
    "Windows 암호화 저장소를 사용할 수 없어 토큰을 저장하지 않았습니다.",
    "The Windows encryption store is unavailable, so the token was not saved.",
    "Windowsの暗号化ストアを利用できないため、トークンは保存されませんでした。",
    "Windows 加密存储不可用，因此未保存令牌。",
  ],
  [
    "저장된 토큰을 복호화하지 못했습니다. 설정에서 다시 저장해 주세요.",
    "Could not decrypt the saved token. Save it again in Settings.",
    "保存済みトークンを復号できません。設定で保存し直してください。",
    "无法解密保存的令牌。请在设置中重新保存。",
  ],
  [
    "Discord에 연결하지 못했습니다. 봇 토큰과 인터넷 연결을 확인해 주세요.",
    "Could not connect to Discord. Check the bot token and internet connection.",
    "Discordに接続できません。Botトークンとインターネット接続を確認してください。",
    "无法连接 Discord。请检查机器人令牌和网络连接。",
  ],
  [
    "봇에 이 음성 채널의 연결 및 말하기 권한이 필요합니다.",
    "The bot needs permission to connect and speak in this voice channel.",
    "Botにこのボイスチャンネルへの接続と発言の権限が必要です。",
    "机器人需要连接此语音频道并发言的权限。",
  ],
  [
    "일반 음성 채널 ID를 입력해 주세요.",
    "Enter a standard voice channel ID.",
    "通常のボイスチャンネルIDを入力してください。",
    "请输入普通语音频道 ID。",
  ],
  [
    "영상 정보를 읽지 못했습니다.",
    "Could not read video details.",
    "動画情報を読み込めません。",
    "无法读取视频信息。",
  ],
  [
    "재생목록 정보를 읽지 못했습니다.",
    "Could not read playlist details.",
    "再生リストの情報を読み込めません。",
    "无法读取播放列表信息。",
  ],
  [
    "재생할 수 있는 영상이 재생목록에 없습니다.",
    "The playlist has no playable videos.",
    "再生できる動画が再生リストにありません。",
    "播放列表中没有可播放的视频。",
  ],
  [
    "2시간 이하의 공개된 일반 영상만 재생할 수 있습니다. 실시간 방송은 지원하지 않습니다.",
    "Only public videos under two hours are supported. Live streams are not supported.",
    "2時間以下の公開動画のみ再生できます。ライブ配信には対応していません。",
    "仅支持两小时以内的公开视频，不支持直播。",
  ],
  [
    "2시간 이하의 영상만 재생할 수 있습니다.",
    "Only videos under two hours can be played.",
    "2時間以下の動画のみ再生できます。",
    "仅可播放两小时以内的视频。",
  ],
  [
    "미디어 캐시가 가득 찼습니다. 앱을 종료한 뒤 캐시를 비워 주세요.",
    "The media cache is full. Close the app and clear the cache.",
    "メディアキャッシュがいっぱいです。アプリを閉じてキャッシュを空にしてください。",
    "媒体缓存已满。请关闭应用后清理缓存。",
  ],
  [
    "영상 파일이 없거나 1GB 제한을 초과했습니다.",
    "Video file is missing or exceeds the 1 GB limit.",
    "動画ファイルがないか、1 GBの制限を超えています。",
    "视频文件不存在或超过 1 GB 限制。",
  ],
  [
    "영상을 가져오지 못했습니다. 공개 영상인지와 인터넷 연결을 확인해 주세요.",
    "Could not download the video. Check that it is public and that you are online.",
    "動画を取得できません。公開動画かどうかとインターネット接続を確認してください。",
    "无法下载视频。请确认视频公开且网络正常。",
  ],
  [
    "영상 파일을 저장하지 못했습니다. 저장 공간을 확인해 주세요.",
    "Could not save the video. Check available disk space.",
    "動画ファイルを保存できません。空き容量を確認してください。",
    "无法保存视频。请检查磁盘空间。",
  ],
  [
    "영상의 음량을 조절하지 못했습니다. 저장 공간을 확인해 주세요.",
    "Could not normalize the audio. Check available disk space.",
    "音量を調整できません。空き容量を確認してください。",
    "无法均衡音量。请检查磁盘空间。",
  ],
  [
    "미디어 도구를 실행하지 못했습니다. 프로그램을 다시 설치해 주세요.",
    "Could not run the media tool. Reinstall the app.",
    "メディアツールを起動できません。アプリを再インストールしてください。",
    "无法运行媒体工具。请重新安装应用。",
  ],
  [
    "미디어 준비 시간이 초과되었습니다. 다시 시도해 주세요.",
    "Media preparation timed out. Try again.",
    "メディアの準備がタイムアウトしました。再試行してください。",
    "媒体准备超时，请重试。",
  ],
  [
    "Discord 오디오를 재생하지 못했습니다. 다시 재생해 주세요.",
    "Could not play Discord audio. Try playing again.",
    "Discordの音声を再生できません。もう一度お試しください。",
    "无法播放 Discord 音频，请重试。",
  ],
  [
    "음성 변환에 실패했습니다. FFmpeg 설치와 파일을 확인해 주세요.",
    "Audio conversion failed. Check FFmpeg and the media file.",
    "音声変換に失敗しました。FFmpegとファイルを確認してください。",
    "音频转换失败。请检查 FFmpeg 和媒体文件。",
  ],
  [
    "음성 연결이 끊어졌습니다. 채널에 다시 참가해 주세요.",
    "Voice connection lost. Rejoin the channel.",
    "音声接続が切れました。チャンネルに参加し直してください。",
    "语音连接已断开。请重新加入频道。",
  ],
  [
    "음성 연결 오류가 발생했습니다. 채널에 다시 참가해 주세요.",
    "Voice connection error. Rejoin the channel.",
    "音声接続エラーです。チャンネルに参加し直してください。",
    "语音连接出错。请重新加入频道。",
  ],
];

const messages = new Map(entries.map(([ko, en, ja, zh]) => [ko, { en, ja, "zh-CN": zh }]));
const fallback: Record<Exclude<Locale, "ko">, string> = {
  en: "Could not complete the action. Check the connection and settings, then try again.",
  ja: "操作を完了できません。接続と設定を確認して再試行してください。",
  "zh-CN": "无法完成操作。请检查连接和设置后重试。",
};

export function localizeRuntime(locale: Locale, message: string): string {
  if (locale === "ko" || !/[가-힣]/.test(message)) return message;
  return messages.get(message)?.[locale] ?? fallback[locale];
}
