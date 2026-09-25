import { useCallback, useEffect, useState } from 'react';
import type { Command, MusicBridge, Snapshot } from '../shared/contracts';

declare global { interface Window { readonly music?: MusicBridge } }
export const emptySnapshot: Snapshot = {
  revision: 0, queue: [], hasToken: false, busy: false, notice: null,
  settings: { pcVolume: 75, discordVolume: 75, channelId: '' },
  connection: { status: 'offline', botName: null, channelId: null, channelName: null, error: null },
  playback: { trackId: null, status: 'idle', position: 0, duration: 0, generation: 0, mediaUrl: null },
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
    const update = (next: Snapshot) => { if (active) setSnapshot(old => next.revision >= old.revision ? next : old); };
    const unsubscribe = bridge.subscribe(update);
    void bridge.snapshot().then(update).catch((reason: unknown) => {
      if (active) setError(reason instanceof Error ? '앱 상태를 불러오지 못했습니다. 앱을 다시 실행해 주세요.' : '앱 연결을 확인해 주세요.');
    });
    return () => { active = false; unsubscribe(); };
  }, []);
  const send = useCallback<Send>(async command => {
    if (!window.music) { setError('데스크톱 앱에서 연결할 수 있어요.'); return false; }
    try {
      const reply = await window.music.command(command);
      if (!reply.ok) { setError(reply.error); return false; }
      setError(null);
      return true;
    } catch (reason: unknown) {
      setError(reason instanceof Error ? '작업을 완료하지 못했습니다. 앱 연결을 확인해 주세요.' : '알 수 없는 연결 오류가 발생했습니다.');
      return false;
    }
  }, []);
  return { snapshot, error, send, available, clearError: () => setError(null) };
}
