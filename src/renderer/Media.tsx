import { Headphones, LoaderCircle, MonitorPlay } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Snapshot } from "../shared/contracts";
import { translator } from "./i18n";
import { seekTarget } from "./media-sync";

export function Media({ snapshot }: { readonly snapshot: Snapshot }) {
  const video = useRef<HTMLVideoElement>(null);
  const generation = useRef(-1);
  const lastSeek = useRef(-Infinity);
  const playPending = useRef(false);
  const [failure, setFailure] = useState(false);
  const t = translator(snapshot.settings.language);
  const playback = snapshot.playback;
  const track = snapshot.queue.find((item) => item.id === playback.trackId);
  // biome-ignore lint/correctness/useExhaustiveDependencies: Reset player state whenever the media source changes.
  useEffect(() => {
    setFailure(false);
    generation.current = -1;
    lastSeek.current = -Infinity;
  }, [playback.mediaUrl]);
  useEffect(() => {
    const element = video.current;
    if (!element || !playback.mediaUrl) return;
    element.volume = snapshot.settings.pcVolume / 100;
    const target = seekTarget({
      ready: element.readyState >= 1,
      seeking: element.seeking,
      seekableEnd: element.seekable.length ? element.seekable.end(element.seekable.length - 1) : 0,
      position: playback.position,
      currentTime: element.currentTime,
      generation: playback.generation,
      appliedGeneration: generation.current,
      elapsedSinceSeek: performance.now() - lastSeek.current,
    });
    if (target !== null) {
      element.currentTime = target;
      generation.current = playback.generation;
      lastSeek.current = performance.now();
    }
    if (playback.status === "playing" && element.paused && !playPending.current) {
      playPending.current = true;
      void element
        .play()
        .then(() => setFailure(false))
        .catch((error: unknown) => {
          if (error instanceof DOMException && error.name === "AbortError") return;
          setFailure(true);
        })
        .finally(() => {
          playPending.current = false;
        });
    } else if (playback.status !== "playing" && !element.paused) element.pause();
  }, [playback, snapshot.settings.pcVolume]);
  return (
    <section className="media-panel" aria-labelledby="now-title">
      <div className="section-eyebrow">
        <span>{t("media.now")}</span>
        <span>
          <MonitorPlay size={14} />
          PC + Discord
        </span>
      </div>
      <div className="media-frame">
        {playback.mediaUrl && (
          // biome-ignore lint/a11y/useMediaCaption: YouTube downloads do not include a caption track.
          <video
            ref={video}
            src={playback.mediaUrl}
            playsInline
            aria-label={track?.title ?? t("media.video")}
            onError={() => setFailure(true)}
          />
        )}
        {(!playback.mediaUrl || playback.status === "preparing" || failure) && (
          <div className="media-placeholder">
            <div className="empty-icon">
              {playback.status === "preparing" ? (
                <LoaderCircle className="spinning" size={32} />
              ) : (
                <Headphones size={36} strokeWidth={1.3} />
              )}
            </div>
            <h1 id="now-title">
              {failure
                ? t("media.failure")
                : playback.status === "preparing"
                  ? t("media.preparing")
                  : t("media.empty")}
            </h1>
            <p>
              {failure
                ? t("media.failureHelp")
                : playback.status === "preparing"
                  ? t("media.preparingHelp")
                  : t("media.emptyHelp")}
            </p>
          </div>
        )}
      </div>
      <div className="now-details">
        <div>
          <h2 title={track?.title}>{track?.title ?? t("media.noTitle")}</h2>
          <p>{track ? t("media.addedBy", { name: track.addedBy }) : t("media.addHint")}</p>
        </div>
        <span className="media-state">
          {playback.status === "playing"
            ? t("media.playing")
            : playback.status === "paused"
              ? t("media.paused")
              : playback.status === "error"
                ? t("media.error")
                : t("media.idle")}
        </span>
      </div>
      {!snapshot.hasToken && (
        <div className="setup-hint">
          <Headphones size={18} />
          <p>
            <strong>{t("media.firstUse")}</strong>
            <br />
            {t("media.firstUseHelp")}
          </p>
        </div>
      )}
    </section>
  );
}
