import { useRef, useState } from 'react';
import { ArrowDown, ArrowUp, ListMusic, Music2, Plus, Trash2 } from 'lucide-react';
import type { Snapshot } from '../shared/contracts';
import type { Send } from './bridge';
import { Button, IconButton, time } from './primitives';

export function Queue({ snapshot, send, available }: { readonly snapshot: Snapshot; readonly send: Send; readonly available: boolean }) {
  const [url, setUrl] = useState('');
  const [pending, setPending] = useState(false);
  const list = useRef<HTMLOListElement>(null);
  const field = useRef<HTMLInputElement>(null);
  return <section className="queue-panel" aria-labelledby="queue-title">
    <div className="queue-heading"><h2 id="queue-title">재생 목록</h2><span className="count">{snapshot.queue.length}</span></div>
    <form className="add-form" onSubmit={async event => {
      event.preventDefault(); if (!url.trim() || pending) return;
      setPending(true); if (await send({ type: 'add', url: url.trim() })) setUrl(''); setPending(false);
    }}>
      <label htmlFor="media-url">음악 또는 재생목록 추가</label>
      <input ref={field} id="media-url" type="url" required maxLength={2048} placeholder="YouTube 영상 또는 재생목록 URL" value={url} onChange={event => setUrl(event.target.value)} disabled={pending} />
      <Button type="submit" disabled={!available || pending || !url.trim()}><Plus size={16} />{pending ? '불러오는 중…' : '추가'}</Button>
    </form>
    {snapshot.queue.length === 0 ? <div className="queue-empty"><ListMusic size={32} strokeWidth={1.4} /><strong>재생 목록이 비어 있어요</strong><p>URL을 추가하면 여기에 표시됩니다.</p></div> : <ol className="queue-list" ref={list}>
      {snapshot.queue.map((track, index) => <li key={track.id} className={`queue-row ${track.id === snapshot.playback.trackId ? 'selected' : ''}`}>
        <button type="button" className="track-select" onClick={() => void send({ type: 'select', id: track.id })} disabled={snapshot.busy} aria-label={`${track.title} 재생`} aria-current={track.id === snapshot.playback.trackId ? 'true' : undefined}>
          <span className="track-number">{track.id === snapshot.playback.trackId ? <Music2 size={18} /> : String(index + 1).padStart(2, '0')}</span><span className="track-details"><strong title={track.title}>{track.title}</strong><span>{track.status === 'preparing' ? '미디어 준비 중' : track.status === 'error' ? '재생 오류' : track.duration ? time(track.duration) : '길이 확인 중'} · {track.addedBy}</span></span>
        </button>
        {track.error && <p className="field-error">{track.error}</p>}
        <div className="row-actions"><IconButton label={`${track.title} 위로 이동`} disabled={index === 0} onClick={() => void send({ type: 'move', id: track.id, direction: -1 })}><ArrowUp size={15} /></IconButton><IconButton label={`${track.title} 아래로 이동`} disabled={index === snapshot.queue.length - 1} onClick={() => void send({ type: 'move', id: track.id, direction: 1 })}><ArrowDown size={15} /></IconButton><IconButton label={`${track.title} 삭제`} onClick={async () => { if (await send({ type: 'remove', id: track.id })) { requestAnimationFrame(() => { const buttons = list.current?.querySelectorAll<HTMLButtonElement>('.track-select'); (buttons?.[Math.min(index, (buttons?.length ?? 1) - 1)] ?? field.current)?.focus(); }); } }}><Trash2 size={15} /></IconButton></div>
      </li>)}
    </ol>}
    <div className="queue-footnote">목록 순서대로 이어서 재생됩니다.</div>
  </section>;
}
