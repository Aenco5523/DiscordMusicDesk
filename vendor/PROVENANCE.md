# Bundled media tools

Music Desk source code is MIT licensed. The separately executed media tools retain their own licenses.

| Tool | Bundled version and origin | License |
| --- | --- | --- |
| `yt-dlp.exe` | [Official 2026.08.19 Windows release](https://github.com/yt-dlp/yt-dlp/releases/tag/2026.08.19), SHA-256 `66674953fe251b89f4d08c5f0e35e0728679bd67ab3d7d05c0562af101dd3e7a` | Unlicense; see `yt-dlp-LICENSE.txt` |
| `ffmpeg.exe` | gyan.dev full static Windows build `2026-06-15-git-44d082edc8`, SHA-256 `864758bf8ea314fc33ce457016bf24d4ebd9af245e98d8691bd1474af9d22c4b` | GPLv3; see `ffmpeg-LICENSE.txt` |

The FFmpeg binary came from `C:\.dev\ffmpeg\bin\ffmpeg.exe`. Its original `ffmpeg-README.txt` records the build version, configuration and linked libraries. The matching FFmpeg core source is [commit `44d082edc87381d978e8588b148116b99fefdb43`](https://github.com/FFmpeg/FFmpeg/tree/44d082edc87381d978e8588b148116b99fefdb43); the release also includes `FFmpeg-44d082edc8-source.zip`. The build provider's [distribution and library details](https://www.gyan.dev/ffmpeg/builds/) identify the bundled build family and external libraries. Their source and license terms remain with the respective upstream projects. Music Desk invokes FFmpeg as a separate process.

The in-app yt-dlp updater checks the official stable channel only when requested. A successful update is stored in the user's app-data directory rather than replacing the bundled executable. The bundled copy remains the fallback. The updated copy is supplied by yt-dlp's upstream release and carries its upstream license.
