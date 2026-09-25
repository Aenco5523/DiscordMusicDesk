# Music Desk

[한국어](../README.md) · [简体中文](README.zh-CN.md) · [日本語](README.ja.md) · English

Music Desk is a Windows desktop app that plays YouTube videos and playlists in the app and sends audio to a Discord voice channel. It has separate PC and Discord volume controls, a video player with seek and playback controls, and a queue. People in the same voice channel can add a video with `/영상추가 url` (shown as `/add-video` in English Discord clients).

![Music Desk player](images/music-desk-player.png)

## Download

Get one Windows x64 file from the [latest release](https://github.com/Aenco5523/discord-music-desk/releases/latest): `Music-Desk-0.2.0-Setup.exe` is a single installer with Korean, Simplified Chinese, Japanese and English choices; `Music-Desk-0.2.0-Portable.exe` runs without installation. The binaries are unsigned.

## Get started

1. Create a Discord bot, save its token in **Settings**, and connect. The token is kept locally using Windows encryption.
2. Invite the bot with the `bot` and `applications.commands` scopes and permission to view, connect to and speak in the voice channel.
3. Enter the **voice channel ID** on the main screen and join.
4. Add a YouTube video or playlist URL. Playlist entries join the queue in order. Voice-channel participants can add videos with the Discord command.
5. Change the app language in **Settings → Language**. The installed app initially uses the installer language; a saved app preference takes priority afterward.

## Playback and updates

Play, pause, skip, go back and seek in the built-in video player. PC and Discord volumes are independent. Each video's audio is analyzed and normalized toward -16 LUFS and -1.5 dBTP; this reduces differences in average loudness without making every moment equally loud. The first play downloads and processes the media; later plays use the local cache.

**Settings → yt-dlp update** checks for the official stable update on demand. A verified update is used for future downloads; if it fails, the existing executable remains available.

Public, ordinary videos up to two hours are supported. Processed files are limited to 1 GB, and the queue to 200 tracks. Live, private and access-restricted videos are unsupported. A playlist exceeding the limit is rejected rather than partially added.

## Build from source

Use Windows x64, Node 22.12 or newer, and pnpm 11. Supply `vendor/yt-dlp.exe` and `vendor/ffmpeg.exe` as described in [vendor provenance](../vendor/PROVENANCE.md). The tracked repository excludes these binaries. Building the installer also requires Inno Setup 6's `ISCC.exe`; set `INNO_SETUP_ISCC` if it is not found automatically.

```powershell
pnpm install
pnpm check
pnpm typecheck
pnpm test
pnpm package:win
pnpm package:installer
```

The installer is written to `release/installer`, and the portable EXE to `release/portable`. The local player QA script, `node scripts/qa-player.cjs "release/portable/win-unpacked/Music Desk.exe"`, needs internet and a public YouTube video. Live Discord voice transmission requires your own bot credentials and channel permissions.

## Privacy and licenses

The bot token, settings and media cache stay on your PC. YouTube is contacted for metadata and downloads; Discord is contacted for bot connection, commands and voice. Music Desk source code is [MIT licensed](../LICENSE). Bundled yt-dlp, FFmpeg, Electron and Inno Setup components retain their own licenses; see [vendor provenance](../vendor/PROVENANCE.md) and the notices included with the binaries.

The release includes `FFmpeg-44d082edc8-source.zip` for the matching FFmpeg core revision.
