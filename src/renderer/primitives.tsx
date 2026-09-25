import { AlertCircle, CheckCircle2, Circle, LoaderCircle, X } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import type { Connection, Locale } from "../shared/contracts";
import { type TranslationKey, translator } from "./i18n";

export function Button({
  children,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" className={`button ${className}`} {...props}>
      {children}
    </button>
  );
}
export function IconButton({
  label,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  readonly label: string;
  readonly children: ReactNode;
}) {
  return (
    <Button
      {...props}
      className={`icon-button ${props.className ?? ""}`}
      aria-label={label}
      title={label}
    >
      {children}
    </Button>
  );
}
const statuses: Record<Connection["status"], TranslationKey> = {
  offline: "status.offline",
  connecting: "status.connecting",
  online: "status.online",
  joining: "status.joining",
  joined: "status.joined",
  error: "status.error",
};
export function StatusBadge({
  connection,
  language,
}: {
  readonly connection: Connection;
  readonly language: Locale;
}) {
  const t = translator(language);
  const active = connection.status === "online" || connection.status === "joined";
  const pending = connection.status === "connecting" || connection.status === "joining";
  const Icon = pending
    ? LoaderCircle
    : active
      ? CheckCircle2
      : connection.status === "error"
        ? AlertCircle
        : Circle;
  return (
    <span className={`status ${active ? "success" : ""}`} role="status">
      <Icon size={14} className={pending ? "spinning" : ""} />
      {t(statuses[connection.status])}
    </span>
  );
}
export function Notice({
  children,
  onClose,
  language,
}: {
  readonly children: ReactNode;
  readonly onClose: () => void;
  readonly language: Locale;
}) {
  const t = translator(language);
  return (
    <div className="notice" role="alert">
      <AlertCircle size={18} />
      <span>{children}</span>
      <IconButton label={t("notice.close")} onClick={onClose}>
        <X size={16} />
      </IconButton>
    </div>
  );
}
export function time(seconds: number) {
  const safe = Math.max(0, Math.floor(seconds));
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, "0")}`;
}
