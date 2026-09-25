import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Circle, LoaderCircle, X } from 'lucide-react';
import type { Connection } from '../shared/contracts';

export function Button({ children, className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" className={`button ${className}`} {...props}>{children}</button>;
}
export function IconButton({ label, children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { readonly label: string; readonly children: ReactNode }) {
  return <Button {...props} className={`icon-button ${props.className ?? ''}`} aria-label={label} title={label}>{children}</Button>;
}
const statuses: Record<Connection['status'], string> = {
  offline: '연결 안 됨', connecting: '연결 중', online: '봇 연결됨', joining: '채널 입장 중', joined: '음성 채널 연결됨', error: '연결 오류',
};
export function StatusBadge({ connection }: { readonly connection: Connection }) {
  const active = connection.status === 'online' || connection.status === 'joined';
  const pending = connection.status === 'connecting' || connection.status === 'joining';
  const Icon = pending ? LoaderCircle : active ? CheckCircle2 : connection.status === 'error' ? AlertCircle : Circle;
  return <span className={`status ${active ? 'success' : ''}`} role="status"><Icon size={14} className={pending ? 'spinning' : ''} />{statuses[connection.status]}</span>;
}
export function Notice({ children, onClose }: { readonly children: ReactNode; readonly onClose: () => void }) {
  return <div className="notice" role="alert"><AlertCircle size={18} /><span>{children}</span><IconButton label="알림 닫기" onClick={onClose}><X size={16} /></IconButton></div>;
}
export function time(seconds: number) {
  const safe = Math.max(0, Math.floor(seconds));
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, '0')}`;
}
