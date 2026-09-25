import { useCallback, useEffect, useState } from "react";
import type { Command, MusicBridge, Snapshot } from "../shared/contracts";
import { translate } from "./i18n";

declare global {
  interface Window {
    readonly music?: MusicBridge;
  }
}
export const emptySnapshot: Snapshot = {
  revision: 0,
  queue: [],
  hasToken: false,
  busy: false,
  notice: null,
  settings: { pcVolume: 75, discordVolume: 75, channelId: "", language: "ko" },
  connection: { status: "offline", botName: null, channelId: null, channelName: null, error: null },
  playback: {
    trackId: null,
    status: "idle",
    position: 0,
    duration: 0,
    generation: 0,
    mediaUrl: null,
  },
};
export type Send = (command: Command) => Promise<boolean>;
export function useMusic() {
  const [snapshot, setSnapshot] = useState(emptySnapshot);
  const [error, setError] = useState<string | null>(null);
  const available = Boolean(window.music);
  useEffect(() => {
    const bridge = window.music;
    if (!bridge) return;
    let active = true;
    const update = (next: Snapshot) => {
      if (active) setSnapshot((old) => (next.revision >= old.revision ? next : old));
    };
    const unsubscribe = bridge.subscribe(update);
    void bridge
      .snapshot()
      .then(update)
      .catch((reason: unknown) => {
        if (active)
          setError(
            reason instanceof Error
              ? translate(emptySnapshot.settings.language, "bridge.loadFailed")
              : translate(emptySnapshot.settings.language, "bridge.connectionCheck"),
          );
      });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);
  const send = useCallback<Send>(
    async (command) => {
      if (!window.music) {
        setError(translate(snapshot.settings.language, "bridge.desktopOnly"));
        return false;
      }
      try {
        const reply = await window.music.command(command);
        if (!reply.ok) {
          setError(reply.error);
          return false;
        }
        setError(null);
        return true;
      } catch (reason: unknown) {
        setError(
          reason instanceof Error
            ? translate(snapshot.settings.language, "bridge.commandFailed")
            : translate(snapshot.settings.language, "bridge.unknownError"),
        );
        return false;
      }
    },
    [snapshot.settings.language],
  );
  return { snapshot, error, send, available, clearError: () => setError(null) };
}
