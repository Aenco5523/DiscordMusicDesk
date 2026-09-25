import { CheckCircle2, KeyRound, Plug, ShieldCheck, Trash2 } from "lucide-react";
import { useState } from "react";
import type { Snapshot } from "../shared/contracts";
import type { Send } from "./bridge";
import { Button, StatusBadge } from "./primitives";

export function Settings({
  snapshot,
  send,
  available,
}: {
  readonly snapshot: Snapshot;
  readonly send: Send;
  readonly available: boolean;
}) {
  const [token, setToken] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  return (
    <section className="settings-page">
      <div className="page-heading">
        <span className="section-eyebrow">환경 설정</span>
        <h1>나의 Discord 봇</h1>
        <p>봇을 연결하고 친구들과 음악을 함께 들으세요.</p>
      </div>
      <section className="settings-card" aria-labelledby="token-heading">
        <div className="settings-section-heading">
          <KeyRound size={22} />
          <div>
            <h2 id="token-heading">봇 토큰</h2>
            <p>Discord Developer Portal에서 발급한 봇 토큰을 입력하세요.</p>
          </div>
        </div>
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            setSaving(true);
            if (await send({ type: "saveToken", token })) {
              setToken("");
              setSaved(true);
            }
            setSaving(false);
          }}
        >
          <label htmlFor="bot-token">봇 토큰</label>
          <input
            id="bot-token"
            type="password"
            autoComplete="off"
            minLength={20}
            maxLength={256}
            required
            value={token}
            onChange={(event) => {
              setToken(event.target.value);
              setSaved(false);
            }}
            placeholder={
              snapshot.hasToken
                ? "새 토큰을 입력하면 기존 토큰을 교체합니다"
                : "봇 토큰을 입력하세요"
            }
            aria-describedby="token-help"
            disabled={!available || saving}
          />
          <p id="token-help" className="help-text">
            <ShieldCheck size={15} />
            토큰은 이 PC에 암호화해 저장되며 화면에 다시 표시되지 않습니다.
          </p>
          <div className="settings-actions">
            <Button
              type="submit"
              className="primary"
              disabled={!available || saving || !token.trim()}
            >
              {saving ? "저장 중…" : "토큰 저장"}
            </Button>
            {snapshot.hasToken && (
              <Button
                className="danger"
                disabled={saving}
                onClick={async () => {
                  if (await send({ type: "forgetToken" })) {
                    setSaved(false);
                    setToken("");
                  }
                }}
              >
                <Trash2 size={16} />
                저장된 토큰 삭제
              </Button>
            )}
            <span className="saved-status" role="status">
              {(saved || snapshot.hasToken) && (
                <>
                  <CheckCircle2 size={15} />
                  토큰 저장됨
                </>
              )}
            </span>
          </div>
        </form>
      </section>
      <section className="settings-card">
        <div className="settings-section-heading">
          <Plug size={22} />
          <div>
            <h2>봇 연결</h2>
            <p>{snapshot.connection.botName ?? "저장한 토큰으로 Discord에 로그인합니다."}</p>
          </div>
          <StatusBadge connection={snapshot.connection} />
        </div>
        <Button
          onClick={() => void send({ type: "connect" })}
          disabled={
            !available ||
            !snapshot.hasToken ||
            snapshot.busy ||
            snapshot.connection.status === "connecting"
          }
        >
          <Plug size={16} />
          {snapshot.connection.status === "connecting" ? "연결 중…" : "Discord 연결"}
        </Button>
      </section>
      <p className="help-text">
        <CheckCircle2 size={15} />
        자동 음량 평준화 적용 · 곡마다 소리 크기 차이를 줄입니다. 첫 재생 준비는 조금 더 걸릴 수
        있어요.
      </p>
      <details className="settings-guide">
        <summary>연결 전 확인해 주세요</summary>
        <ol>
          <li>봇을 Discord 서버에 초대하세요.</li>
          <li>봇에 음성 채널의 보기 · 연결 · 말하기 권한을 허용하세요.</li>
          <li>Discord 개발자 모드에서 음성 채널 ID를 복사해 플레이어에 입력하세요.</li>
        </ol>
      </details>
    </section>
  );
}
