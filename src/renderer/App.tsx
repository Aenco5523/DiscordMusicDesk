import { useState } from 'react';
import { Headphones, Music2, Settings2 } from 'lucide-react';
import { useMusic } from './bridge';
import { ConnectionHeader } from './ConnectionHeader';
import { Media } from './Media';
import { Queue } from './Queue';
import { Settings } from './Settings';
import { Transport } from './Transport';
import { Button, Notice } from './primitives';
import { Showcase } from './Showcase';

export function App() {
  const [page, setPage] = useState<'player' | 'settings'>('player');
  const { snapshot, send, available, error, clearError } = useMusic();
  if (new URLSearchParams(window.location.search).has('showcase')) return <Showcase />;
  const notice = error ?? snapshot.connection.error ?? snapshot.notice;
  return <div className="app-shell"><aside className="sidebar"><div className="brand" title="Music Desk"><Headphones size={26} /></div><nav aria-label="주 메뉴"><Button className={`nav-item ${page === 'player' ? 'active' : ''}`} aria-current={page === 'player' ? 'page' : undefined} onClick={() => setPage('player')}><Music2 size={22} /><span>플레이어</span></Button><Button className={`nav-item ${page === 'settings' ? 'active' : ''}`} aria-current={page === 'settings' ? 'page' : undefined} onClick={() => setPage('settings')}><Settings2 size={22} /><span>설정</span></Button></nav><span className="sidebar-foot">Music<br />Desk</span></aside>
    <main className="workspace"><ConnectionHeader snapshot={snapshot} send={send} available={available} settings={() => setPage('settings')} /><div className="workspace-content">{!available && <div className="preview-banner" role="status">데스크톱 앱에서 연결할 수 있어요. 현재는 화면 미리보기입니다.</div>}{notice && <Notice onClose={() => { clearError(); void send({ type: 'dismiss' }); }}>{notice}</Notice>}<div className={`page-content ${page === 'settings' ? 'settings-content' : ''}`}><div className="player-content" hidden={page !== 'player'}><Media snapshot={snapshot} /><Queue snapshot={snapshot} send={send} available={available} /></div>{page === 'settings' && <Settings snapshot={snapshot} send={send} available={available} />}</div></div><Transport snapshot={snapshot} send={send} available={available} /></main>
  </div>;
}
