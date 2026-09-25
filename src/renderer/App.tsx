import { Headphones, Music2, Settings2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useMusic } from "./bridge";
import { ConnectionHeader } from "./ConnectionHeader";
import { translator } from "./i18n";
import { localizeRuntime } from "./i18n/runtime";
import { Media } from "./Media";
import { Button, Notice } from "./primitives";
import { Queue } from "./Queue";
import { Settings } from "./Settings";
import { Showcase } from "./Showcase";
import { Transport } from "./Transport";

export function App() {
  const [page, setPage] = useState<"player" | "settings">("player");
  const { snapshot, send, available, error, clearError } = useMusic();
  const t = translator(snapshot.settings.language);
  useEffect(() => {
    document.documentElement.lang = snapshot.settings.language;
  }, [snapshot.settings.language]);
  if (new URLSearchParams(window.location.search).has("showcase")) return <Showcase />;
  const rawNotice = error ?? snapshot.connection.error ?? snapshot.notice;
  const notice = rawNotice ? localizeRuntime(snapshot.settings.language, rawNotice) : null;
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand" title="Music Desk">
          <Headphones size={26} />
        </div>
        <nav aria-label={t("nav.main")}>
          <Button
            className={`nav-item ${page === "player" ? "active" : ""}`}
            aria-current={page === "player" ? "page" : undefined}
            onClick={() => setPage("player")}
          >
            <Music2 size={22} />
            <span>{t("nav.player")}</span>
          </Button>
          <Button
            className={`nav-item ${page === "settings" ? "active" : ""}`}
            aria-current={page === "settings" ? "page" : undefined}
            onClick={() => setPage("settings")}
          >
            <Settings2 size={22} />
            <span>{t("nav.settings")}</span>
          </Button>
        </nav>
        <span className="sidebar-foot">
          Music
          <br />
          Desk
        </span>
      </aside>
      <main className="workspace">
        <ConnectionHeader
          snapshot={snapshot}
          send={send}
          available={available}
          settings={() => setPage("settings")}
        />
        <div className="workspace-content">
          {!available && (
            <div className="preview-banner" role="status">
              {t("preview.banner")}
            </div>
          )}
          {notice && (
            <Notice
              language={snapshot.settings.language}
              onClose={() => {
                clearError();
                void send({ type: "dismiss" });
              }}
            >
              {notice}
            </Notice>
          )}
          <div className={`page-content ${page === "settings" ? "settings-content" : ""}`}>
            <div className="player-content" hidden={page !== "player"}>
              <Media snapshot={snapshot} />
              <Queue snapshot={snapshot} send={send} available={available} />
            </div>
            {page === "settings" && (
              <Settings snapshot={snapshot} send={send} available={available} />
            )}
          </div>
        </div>
        <Transport snapshot={snapshot} send={send} available={available} />
      </main>
    </div>
  );
}
