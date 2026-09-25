# Music Desk

[한국어](../README.md) · [简体中文](README.zh-CN.md) · 日本語 · [English](README.en.md)

Music Desk は、YouTube の動画やプレイリストをアプリ内で再生し、音声を Discord のボイスチャンネルへ送る Windows アプリです。動画プレーヤー、再生位置、再生キュー、PC と Discord の個別音量を一画面で操作できます。同じボイスチャンネルの参加者は `/영상추가 url` コマンド（日本語の Discord では `/動画追加`）で動画を追加できます。

![Music Desk のプレーヤー](images/music-desk-player.png)

## ダウンロード

[最新リリース](https://github.com/Aenco5523/discord-music-desk/releases/latest)から Windows x64 用のファイルを一つ選んでください。`Music-Desk-0.2.0-Setup.exe` は韓国語・簡体字中国語・日本語・英語を一つにまとめたインストーラーです。`Music-Desk-0.2.0-Portable.exe` はインストール不要です。どちらもコード署名はありません。

## 使い方

1. Discord ボットを作成し、**設定**でトークンを保存して接続します。トークンは Windows の暗号化機能を使ってローカルに保存されます。
2. `bot` と `applications.commands` のスコープ、ボイスチャンネルの表示・接続・発言権限を付けてボットをサーバーへ招待します。
3. メイン画面に**ボイスチャンネル ID**を入力して参加します。
4. YouTube の動画またはプレイリストの URL を追加します。プレイリストの動画は順にキューへ入ります。
5. **設定 → 言語**でアプリの言語を変更できます。インストール版の初回起動ではインストーラーの言語を使い、その後はアプリ内に保存した設定を優先します。

## 再生と更新

再生・一時停止・前後の曲・シークを操作できます。PC と Discord の音量は独立しています。動画ごとの平均音量を -16 LUFS と -1.5 dBTP を目標に調整しますが、すべての瞬間の音量が同じになるわけではありません。初回再生ではダウンロードと処理が必要で、次回からローカルキャッシュを使用します。

**設定 → yt-dlp 更新**から公式の安定版を手動で確認できます。検証に成功した更新は次回のダウンロードから使われ、失敗した場合は従来の実行ファイルを維持します。

公開されている通常の動画（2 時間以内）に対応します。処理後のファイルは 1 GB 以下、キューは最大 200 曲です。ライブ配信、非公開、アクセス制限付きの動画には対応しません。上限を超えるプレイリストは一部だけ追加せず、エラーを表示します。

## ソースからビルド

Windows x64、Node 22.12 以上、pnpm 11 が必要です。[ツールの出所](../vendor/PROVENANCE.md)に従って `vendor/yt-dlp.exe` と `vendor/ffmpeg.exe` を用意してください。これらの実行ファイルは Git に含まれません。インストーラーのビルドには Inno Setup 6 の `ISCC.exe` も必要です。自動検出できない場合は `INNO_SETUP_ISCC` を設定してください。

```powershell
pnpm install
pnpm check
pnpm typecheck
pnpm test
pnpm package:win
pnpm package:installer
```

インストーラーは `release/installer`、ポータブル版は `release/portable` に作成されます。実際の Discord 音声送信の確認には、ボットの認証情報とチャンネル権限が必要です。

## プライバシーとライセンス

ボットトークン、設定、メディアキャッシュは PC 内に保存されます。動画情報とダウンロードには YouTube、ボット接続と音声送信には Discord の通信を使用します。Music Desk のソースコードは [MIT ライセンス](../LICENSE)です。同梱の yt-dlp、FFmpeg、Electron、Inno Setup 関連ファイルには各自のライセンスが適用されます。

対応する FFmpeg 本体のソースはリリースの `FFmpeg-44d082edc8-source.zip` に含まれます。
