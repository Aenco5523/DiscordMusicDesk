import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { app, BrowserWindow, dialog, ipcMain, protocol, safeStorage, session } from "electron";
import type { Reply, Snapshot, ToolReply } from "../shared/contracts";
import { AppError, commandSchema, userMessage } from "../shared/contracts";
import { Controller } from "./controller";
import { DiscordService } from "./discord";
import { MediaService } from "./media";
import { mediaResponse } from "./media-response";
import { Storage } from "./storage";
import { YtDlpManager } from "./yt-dlp";

protocol.registerSchemesAsPrivileged([
  {
    scheme: "music-media",
    privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true },
  },
]);
const { MUSIC_DESK_USER_DATA: qaData } = process.env;
if (qaData) app.setPath("userData", qaData);
let window: BrowserWindow | null = null;
let controller: Controller | null = null;
const rendererPath = join(__dirname, "../renderer/index.html");
const rendererUrl = pathToFileURL(rendererPath).href;
const windowIcon = app.isPackaged
  ? join(process.resourcesPath, "app-icon.ico")
  : join(app.getAppPath(), "build", "icon.ico");
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (window?.isMinimized()) window.restore();
    window?.focus();
  });
  app
    .whenReady()
    .then(async () => {
      const storage = new Storage(app.getPath("userData"), safeStorage);
      const toolsDir = app.isPackaged
        ? join(process.resourcesPath, "tools")
        : join(app.getAppPath(), "vendor");
      const ytDlp = new YtDlpManager(join(toolsDir, "yt-dlp.exe"), app.getPath("userData"));
      const media = new MediaService(toolsDir, join(app.getPath("userData"), "media-cache"), () =>
        ytDlp.executable(),
      );
      const voice = new DiscordService({
        ffmpegPath: join(toolsDir, "ffmpeg.exe"),
        onConnection: (state) => controller?.connection(state),
        onAdd: async (url, by, authorize) => {
          await controller?.add(url, by, authorize);
        },
        onError: (message) => controller?.report(message),
      });
      const publish = (state: Snapshot) => {
        if (window && !window.isDestroyed()) window.webContents.send("music:state", state);
      };
      controller = new Controller({ storage, media, voice, publish });
      protocol.handle("music-media", async (request) => {
        const u = new URL(request.url);
        const id = u.pathname.slice(1);
        if (u.hostname !== "track" || !/^[-a-f0-9]{36}$/.test(id))
          return new Response("Not found", { status: 404 });
        const file = media.fileFor(id);
        if (!file) return new Response("Not found", { status: 404 });
        return mediaResponse(file, request);
      });
      session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) =>
        callback(false),
      );
      session.defaultSession.setPermissionCheckHandler(() => false);
      function trusted(event: Electron.IpcMainInvokeEvent): void {
        if (
          event.sender !== window?.webContents ||
          event.senderFrame !== window.webContents.mainFrame ||
          event.senderFrame.url !== rendererUrl
        )
          throw new AppError("IPC", "허용되지 않은 요청입니다.");
      }
      ipcMain.handle("music:snapshot", (event) => {
        trusted(event);
        return controller?.snapshot();
      });
      ipcMain.handle("music:command", async (event, payload: unknown): Promise<Reply> => {
        try {
          trusted(event);
          await controller?.command(commandSchema.parse(payload));
          return { ok: true };
        } catch (error) {
          return { ok: false, error: userMessage(error) };
        }
      });
      ipcMain.handle("music:yt-dlp-version", (event) => {
        trusted(event);
        return ytDlp.version();
      });
      ipcMain.handle("music:yt-dlp-update", async (event): Promise<ToolReply> => {
        try {
          trusted(event);
          const state = controller?.snapshot();
          if (state?.busy || state?.playback.status === "preparing")
            throw new AppError("YTDLP_BUSY", "미디어 준비가 끝난 뒤 업데이트해 주세요.");
          return { ok: true, ...(await ytDlp.update()) };
        } catch (error) {
          return { ok: false, error: userMessage(error) };
        }
      });
      window = new BrowserWindow({
        width: 1320,
        height: 860,
        minWidth: 1000,
        minHeight: 700,
        title: "Music Desk",
        icon: windowIcon,
        backgroundColor: "#101112",
        autoHideMenuBar: true,
        webPreferences: {
          preload: join(__dirname, "../preload/index.cjs"),
          contextIsolation: true,
          nodeIntegration: false,
          sandbox: true,
          webSecurity: true,
          autoplayPolicy: "no-user-gesture-required",
        },
      });
      window.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
      window.webContents.on("will-navigate", (event) => event.preventDefault());
      window.on("closed", () => {
        window = null;
      });
      await window.loadFile(rendererPath);
    })
    .catch((error) => {
      dialog.showErrorBox("Music Desk", userMessage(error));
      app.quit();
    });
  app.on("window-all-closed", () => app.quit());
  app.on("before-quit", () => controller?.dispose());
}
