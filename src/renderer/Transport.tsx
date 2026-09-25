import {
  Headphones,
  Monitor,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useRef, useState } from "react";
import type { Snapshot } from "../shared/contracts";
import type { Send } from "./bridge";
import { translator } from "./i18n";
import { IconButton, time } from "./primitives";

function Volume({
  label,
  target,
  value,
  send,
  available,
  language,
}: {
  readonly label: string;
  readonly target: "pc" | "discord";
  readonly value: number;
  readonly send: Send;
  readonly available: boolean;
  readonly language: Snapshot["settings"]["language"];
}) {
  const t = translator(language);
  const previous = useRef(75);
  return (
    <div className="volume-control">
      <div className="volume-label">
        {target === "pc" ? <Monitor size={14} /> : <Headphones size={14} />}
        <label htmlFor={`volume-${target}`}>{label}</label>
        <span>{value}%</span>
      </div>
      <div className="volume-slider">
        <IconButton
          label={`${label} ${value === 0 ? t("transport.unmute") : t("transport.mute")}`}
          disabled={!available}
          onClick={() => {
            if (value > 0) previous.current = value;
            void send({ type: "volume", target, value: value > 0 ? 0 : previous.current });
          }}
        >
          {value === 0 ? <VolumeX size={17} /> : <Volume2 size={17} />}
        </IconButton>
        <input
          id={`volume-${target}`}
          type="range"
          min="0"
          max="100"
          value={value}
          disabled={!available}
          onChange={(event) =>
            void send({ type: "volume", target, value: Number(event.target.value) })
          }
          aria-valuetext={`${value}%`}
        />
      </div>
    </div>
  );
}
export function Transport({
  snapshot,
  send,
  available,
}: {
  readonly snapshot: Snapshot;
  readonly send: Send;
  readonly available: boolean;
}) {
  const t = translator(snapshot.settings.language);
  const [preview, setPreview] = useState<number | null>(null);
  const pendingSeek = useRef<number | null>(null);
  const playback = snapshot.playback;
  const index = snapshot.queue.findIndex((item) => item.id === playback.trackId);
  const canPlay = available && snapshot.queue.length > 0 && playback.status !== "preparing";
  const seek = () => {
    const position = pendingSeek.current;
    if (position === null) return;
    pendingSeek.current = null;
    void send({ type: "seek", position }).finally(() => setPreview(null));
  };
  const cancelSeek = () => {
    pendingSeek.current = null;
    setPreview(null);
  };
  return (
    <section className="transport" aria-label={t("transport.controls")}>
      <div className="transport-main">
        <div className="transport-buttons">
          <IconButton
            label={t("transport.previous")}
            disabled={!canPlay || index <= 0}
            onClick={() => void send({ type: "previous" })}
          >
            <SkipBack size={21} />
          </IconButton>
          <IconButton
            label={playback.status === "playing" ? t("transport.pause") : t("transport.play")}
            className="play-button"
            disabled={!canPlay}
            onClick={() => void send({ type: "toggle" })}
          >
            {playback.status === "playing" ? (
              <Pause size={23} fill="currentColor" />
            ) : (
              <Play size={23} fill="currentColor" />
            )}
          </IconButton>
          <IconButton
            label={t("transport.next")}
            disabled={!canPlay || index >= snapshot.queue.length - 1}
            onClick={() => void send({ type: "next" })}
          >
            <SkipForward size={21} />
          </IconButton>
        </div>
        <div className="seek">
          <span>{time(preview ?? playback.position)}</span>
          <input
            type="range"
            aria-label={t("transport.seek")}
            min="0"
            max={playback.duration || 1}
            step="0.1"
            value={preview ?? Math.min(playback.position, playback.duration)}
            disabled={!available || !playback.duration || playback.status === "preparing"}
            onChange={(event) => {
              const value = Number(event.currentTarget.value);
              pendingSeek.current = value;
              setPreview(value);
            }}
            onPointerDown={(event) => event.currentTarget.setPointerCapture(event.pointerId)}
            onPointerUp={seek}
            onPointerCancel={cancelSeek}
            onKeyUp={seek}
            onBlur={seek}
            aria-valuetext={`${time(preview ?? playback.position)} / ${time(playback.duration)}`}
          />
          <span>{time(playback.duration)}</span>
        </div>
      </div>
      <div className="output-controls">
        <Volume
          label={t("transport.pcVolume")}
          target="pc"
          value={snapshot.settings.pcVolume}
          send={send}
          available={available}
          language={snapshot.settings.language}
        />
        <Volume
          label={t("transport.discordVolume")}
          target="discord"
          value={snapshot.settings.discordVolume}
          send={send}
          available={available}
          language={snapshot.settings.language}
        />
      </div>
    </section>
  );
}
