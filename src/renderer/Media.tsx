import { Headphones, LoaderCircle, MonitorPlay } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Snapshot } from "../shared/contracts";
import { seekTarget } from "./media-sync";

export function Media({ snapshot }: { readonly snapshot: Snapshot }) {
  const video = useRef<HTMLVideoElement>(null);
  const generation = useRef(-1);
  const lastSeek = useRef(-Infinity);
  const playPending = useRef(false);
  const [failure, setFailure] = useState(false);
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
        <span>지금 재생</span>
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
            aria-label={track?.title ?? "현재 음악 동영상"}
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
                ? "PC 미디어를 재생할 수 없어요"
                : playback.status === "preparing"
                  ? "미디어를 불러오는 중"
                  : "재생할 음악을 추가하세요"}
            </h1>
            <p>
              {failure
                ? "다른 음악을 선택하거나 다시 재생해 주세요."
                : playback.status === "preparing"
                  ? "재생 준비가 끝나면 자동으로 시작합니다."
                  : "좋아하는 음악을 Discord에서 함께 들어보세요."}
            </p>
          </div>
        )}
      </div>
      <div className="now-details">
        <div>
          <h2 title={track?.title}>{track?.title ?? "함께 듣는 음악, 한곳에서"}</h2>
          <p>
            {track
              ? `추가한 사람 · ${track.addedBy}`
              : "오른쪽 재생 목록에 음악 URL을 추가해 시작하세요."}
          </p>
        </div>
        <span className="media-state">
          {playback.status === "playing"
            ? "재생 중"
            : playback.status === "paused"
              ? "일시 정지"
              : playback.status === "error"
                ? "재생 오류"
                : "대기 중"}
        </span>
      </div>
      {!snapshot.hasToken && (
        <div className="setup-hint">
          <Headphones size={18} />
          <p>
            <strong>처음 사용하시나요?</strong>
            <br />
            설정에서 봇 토큰을 저장하고, 음성 채널 ID로 입장하세요.
          </p>
        </div>
      )}
    </section>
  );
}
