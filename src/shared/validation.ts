import { AppError } from "./contracts";
export function youtubeUrl(input: string): string {
  let u: URL;
  try {
    u = new URL(input);
  } catch (error) {
    if (error instanceof TypeError)
      throw new AppError("URL", "올바른 YouTube 영상 URL을 입력해 주세요.");
    throw error;
  }
  if (u.protocol !== "https:" || u.username || u.password || u.port)
    throw new AppError("URL", "https:// YouTube 영상 주소만 사용할 수 있습니다.");
  let id: string | null = null;
  switch (u.hostname) {
    case "youtu.be":
      id = u.pathname.slice(1);
      break;
    case "youtube.com":
    case "www.youtube.com":
    case "m.youtube.com":
      if (u.pathname === "/watch") id = u.searchParams.get("v");
      else if (/^\/(shorts|embed)\//.test(u.pathname)) id = u.pathname.split("/")[2] ?? null;
      break;
    default:
      throw new AppError("URL", "YouTube 영상 주소만 추가할 수 있습니다.");
  }
  if (!id || !/^[A-Za-z0-9_-]{11}$/.test(id))
    throw new AppError("URL", "재생목록이 아닌 개별 YouTube 영상 URL을 입력해 주세요.");
  return `https://www.youtube.com/watch?v=${id}`;
}
export function youtubeInput(input: string): Readonly<{ kind: "video" | "playlist"; url: string }> {
  let u: URL;
  try {
    u = new URL(input);
  } catch {
    throw new AppError("URL", "올바른 YouTube 영상 또는 재생목록 URL을 입력해 주세요.");
  }
  if (
    u.protocol !== "https:" ||
    u.username ||
    u.password ||
    u.port ||
    !["youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com", "youtu.be"].includes(
      u.hostname,
    )
  )
    throw new AppError("URL", "https:// YouTube 주소만 사용할 수 있습니다.");
  if (u.pathname === "/playlist" || (u.pathname === "/watch" && u.searchParams.has("list"))) {
    const list = u.searchParams.get("list");
    if (!list || !/^[A-Za-z0-9_-]{10,128}$/.test(list))
      throw new AppError("URL", "올바른 YouTube 재생목록 URL을 입력해 주세요.");
    return { kind: "playlist", url: `https://www.youtube.com/playlist?list=${list}` };
  }
  return { kind: "video", url: youtubeUrl(input) };
}
export function mayAddFromVoice(
  member: Readonly<{ guildId: string; channelId: string | null }>,
  bot: Readonly<{ guildId: string; channelId: string | null }>,
): boolean {
  return (
    member.guildId === bot.guildId &&
    member.channelId !== null &&
    member.channelId === bot.channelId
  );
}
