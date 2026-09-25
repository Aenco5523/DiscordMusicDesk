import { Headphones, LogOut, Radio } from "lucide-react";
import { useEffect, useState } from "react";
import type { Snapshot } from "../shared/contracts";
import type { Send } from "./bridge";
import { translator } from "./i18n";
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
  const t = translator(snapshot.settings.language);
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
          <strong>{snapshot.connection.channelName ?? t("connection.title")}</strong>
          <StatusBadge connection={snapshot.connection} language={snapshot.settings.language} />
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
          <label htmlFor="channel-id">{t("connection.channel")}</label>
          <input
            id="channel-id"
            inputMode="numeric"
            placeholder={t("connection.placeholder")}
            value={channel}
            onChange={(event) => setChannel(event.target.value)}
            aria-invalid={invalid}
            aria-describedby={invalid ? "channel-error" : undefined}
            disabled={joined}
          />
          {invalid && (
            <span id="channel-error" className="field-error">
              {t("connection.invalid")}
            </span>
          )}
        </div>
        {joined ? (
          <Button onClick={() => void send({ type: "leave" })}>
            <LogOut size={16} />
            {t("connection.leave")}
          </Button>
        ) : (
          <Button
            type="submit"
            className="primary"
            disabled={!available || pending || snapshot.busy || !snapshot.hasToken}
          >
            <Headphones size={16} />
            {pending ? t("connection.joining") : t("connection.join")}
          </Button>
        )}
        {!snapshot.hasToken && (
          <Button className="text-button" onClick={settings}>
            {t("connection.botSettings")}
          </Button>
        )}
      </form>
    </header>
  );
}
