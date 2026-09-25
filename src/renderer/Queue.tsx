import { ArrowDown, ArrowUp, ListMusic, Music2, Plus, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import type { Snapshot } from "../shared/contracts";
import type { Send } from "./bridge";
import { translator } from "./i18n";
import { localizeRuntime } from "./i18n/runtime";
import { Button, IconButton, time } from "./primitives";

export function Queue({
  snapshot,
  send,
  available,
}: {
  readonly snapshot: Snapshot;
  readonly send: Send;
  readonly available: boolean;
}) {
  const t = translator(snapshot.settings.language);
  const [url, setUrl] = useState("");
  const [pending, setPending] = useState(false);
  const list = useRef<HTMLOListElement>(null);
  const field = useRef<HTMLInputElement>(null);
  return (
    <section className="queue-panel" aria-labelledby="queue-title">
      <div className="queue-heading">
        <h2 id="queue-title">{t("queue.title")}</h2>
        <span className="count">{snapshot.queue.length}</span>
      </div>
      <form
        className="add-form"
        onSubmit={async (event) => {
          event.preventDefault();
          if (!url.trim() || pending) return;
          setPending(true);
          if (await send({ type: "add", url: url.trim() })) setUrl("");
          setPending(false);
        }}
      >
        <label htmlFor="media-url">{t("queue.addLabel")}</label>
        <input
          ref={field}
          id="media-url"
          type="url"
          required
          maxLength={2048}
          placeholder={t("queue.placeholder")}
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          disabled={pending}
        />
        <Button type="submit" disabled={!available || pending || !url.trim()}>
          <Plus size={16} />
          {pending ? t("queue.loading") : t("queue.add")}
        </Button>
      </form>
      {snapshot.queue.length === 0 ? (
        <div className="queue-empty">
          <ListMusic size={32} strokeWidth={1.4} />
          <strong>{t("queue.empty")}</strong>
          <p>{t("queue.emptyHelp")}</p>
        </div>
      ) : (
        <ol className="queue-list" ref={list}>
          {snapshot.queue.map((track, index) => (
            <li
              key={track.id}
              className={`queue-row ${track.id === snapshot.playback.trackId ? "selected" : ""}`}
            >
              <button
                type="button"
                className="track-select"
                onClick={() => void send({ type: "select", id: track.id })}
                disabled={snapshot.busy}
                aria-label={t("queue.play", { title: track.title })}
                aria-current={track.id === snapshot.playback.trackId ? "true" : undefined}
              >
                <span className="track-number">
                  {track.id === snapshot.playback.trackId ? (
                    <Music2 size={18} />
                  ) : (
                    String(index + 1).padStart(2, "0")
                  )}
                </span>
                <span className="track-details">
                  <strong title={track.title}>{track.title}</strong>
                  <span>
                    {track.status === "preparing"
                      ? t("queue.preparing")
                      : track.status === "error"
                        ? t("queue.error")
                        : track.duration
                          ? time(track.duration)
                          : t("queue.durationPending")}{" "}
                    · {track.addedBy}
                  </span>
                </span>
              </button>
              {track.error && (
                <p className="field-error">
                  {localizeRuntime(snapshot.settings.language, track.error)}
                </p>
              )}
              <div className="row-actions">
                <IconButton
                  label={t("queue.moveUp", { title: track.title })}
                  disabled={index === 0}
                  onClick={() => void send({ type: "move", id: track.id, direction: -1 })}
                >
                  <ArrowUp size={15} />
                </IconButton>
                <IconButton
                  label={t("queue.moveDown", { title: track.title })}
                  disabled={index === snapshot.queue.length - 1}
                  onClick={() => void send({ type: "move", id: track.id, direction: 1 })}
                >
                  <ArrowDown size={15} />
                </IconButton>
                <IconButton
                  label={t("queue.remove", { title: track.title })}
                  onClick={async () => {
                    if (await send({ type: "remove", id: track.id })) {
                      requestAnimationFrame(() => {
                        const buttons =
                          list.current?.querySelectorAll<HTMLButtonElement>(".track-select");
                        (
                          buttons?.[Math.min(index, (buttons?.length ?? 1) - 1)] ?? field.current
                        )?.focus();
                      });
                    }
                  }}
                >
                  <Trash2 size={15} />
                </IconButton>
              </div>
            </li>
          ))}
        </ol>
      )}
      <div className="queue-footnote">{t("queue.footnote")}</div>
    </section>
  );
}
