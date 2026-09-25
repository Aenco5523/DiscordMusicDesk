import { contextBridge, ipcRenderer } from "electron";
import type { MusicBridge, Snapshot } from "../shared/contracts";

const bridge: MusicBridge = {
  snapshot: () => ipcRenderer.invoke("music:snapshot"),
  command: (command) => ipcRenderer.invoke("music:command", command),
  ytDlpVersion: () => ipcRenderer.invoke("music:yt-dlp-version"),
  updateYtDlp: () => ipcRenderer.invoke("music:yt-dlp-update"),
  subscribe: (listener) => {
    const handler = (_event: Electron.IpcRendererEvent, snapshot: Snapshot) => listener(snapshot);
    ipcRenderer.on("music:state", handler);
    return () => ipcRenderer.removeListener("music:state", handler);
  },
};
contextBridge.exposeInMainWorld("music", bridge);
