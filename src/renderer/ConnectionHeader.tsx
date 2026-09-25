import { Headphones, LogOut, Radio } from "lucide-react";
import { useEffect, useState } from "react";
import type { Snapshot } from "../shared/contracts";
import type { Send } from "./bridge";
import { Button, StatusBadge } from "./primitives";

export function ConnectionHeader({
  snapshot,
  send,
  available,
  settings,
}: {
  readonly snapshot: Snapshot;
  readonly send: Send;
  readonly available: boolean;
  readonly settings: () => void;
}) {
  const [channel, setChannel] = useState("");
  const [pending, setPending] = useState(false);
  const [invalid, setInvalid] = useState(false);
  useEffect(() => {
    setChannel(snapshot.settings.channelId);
  }, [snapshot.settings.channelId]);
  const joined = snapshot.connection.status === "joined";
  return (
    <header className="connection-header">
      <div className="connection-title">
        <Radio size={20} />
        <div>
          <strong>{snapshot.connection.channelName ?? "Discord 연결"}</strong>
          <StatusBadge connection={snapshot.connection} />
        </div>
      </div>
      <form
        className="channel-form"
        onSubmit={async (event) => {
          event.preventDefault();
          if (!/^\d{17,20}$/.test(channel.trim())) {
            setInvalid(true);
            return;
          }
          setInvalid(false);
          setPending(true);
          await send({ type: "join", channelId: channel.trim() });
          setPending(false);
        }}
      >
        <div className="channel-field">
          <label htmlFor="channel-id">음성 채널 ID</label>
          <input
            id="channel-id"
            inputMode="numeric"
            placeholder="17~20자리 채널 ID"
            value={channel}
            onChange={(event) => setChannel(event.target.value)}
            aria-invalid={invalid}
            aria-describedby={invalid ? "channel-error" : undefined}
            disabled={joined}
          />
          {invalid && (
            <span id="channel-error" className="field-error">
              17~20자리 숫자를 입력해 주세요.
            </span>
          )}
        </div>
        {joined ? (
          <Button onClick={() => void send({ type: "leave" })}>
            <LogOut size={16} />
            나가기
          </Button>
        ) : (
          <Button
            type="submit"
            className="primary"
            disabled={!available || pending || snapshot.busy || !snapshot.hasToken}
          >
            <Headphones size={16} />
            {pending ? "입장 중" : "입장"}
          </Button>
        )}
        {!snapshot.hasToken && (
          <Button className="text-button" onClick={settings}>
            봇 설정
          </Button>
        )}
      </form>
    </header>
  );
}
