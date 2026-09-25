import { CheckCircle2, KeyRound, Plug, RefreshCw, ShieldCheck, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { Snapshot } from "../shared/contracts";
import { localeSchema } from "../shared/contracts";
import type { Send } from "./bridge";
import { languageOptions, translator } from "./i18n";
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
  const t = translator(snapshot.settings.language);
  const [token, setToken] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [ytVersion, setYtVersion] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [updateResult, setUpdateResult] = useState<"updated" | "upToDate" | "failed" | null>(null);
  useEffect(() => {
    let active = true;
    void window.music
      ?.ytDlpVersion()
      .then((version) => {
        if (active) setYtVersion(version);
      })
      .catch(() => {
        if (active) setYtVersion("");
      });
    return () => {
      active = false;
    };
  }, []);
  return (
    <section className="settings-page">
      <div className="page-heading">
        <div>
          <span className="section-eyebrow">{t("settings.eyebrow")}</span>
          <h1>{t("settings.title")}</h1>
          <p>{t("settings.subtitle")}</p>
        </div>
        <div className="language-control">
          <label htmlFor="app-language">{t("settings.languageTitle")}</label>
          <select
            id="app-language"
            value={snapshot.settings.language}
            disabled={!available}
            onChange={(event) =>
              void send({
                type: "language",
                language: localeSchema.parse(event.currentTarget.value),
              })
            }
          >
            {languageOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <section className="settings-card" aria-labelledby="token-heading">
        <div className="settings-section-heading">
          <KeyRound size={22} />
          <div>
            <h2 id="token-heading">{t("settings.tokenTitle")}</h2>
            <p>{t("settings.tokenHelp")}</p>
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
          <label htmlFor="bot-token">{t("settings.tokenTitle")}</label>
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
              snapshot.hasToken ? t("settings.tokenReplace") : t("settings.tokenPlaceholder")
            }
            aria-describedby="token-help"
            disabled={!available || saving}
          />
          <p id="token-help" className="help-text">
            <ShieldCheck size={15} />
            {t("settings.tokenStorage")}
          </p>
          <div className="settings-actions">
            <Button
              type="submit"
              className="primary"
              disabled={!available || saving || !token.trim()}
            >
              {saving ? t("settings.saving") : t("settings.saveToken")}
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
                {t("settings.deleteToken")}
              </Button>
            )}
            <span className="saved-status" role="status">
              {(saved || snapshot.hasToken) && (
                <>
                  <CheckCircle2 size={15} />
                  {t("settings.tokenSaved")}
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
            <h2>{t("settings.connectionTitle")}</h2>
            <p>{snapshot.connection.botName ?? t("settings.connectionHelp")}</p>
          </div>
          <StatusBadge connection={snapshot.connection} language={snapshot.settings.language} />
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
          {snapshot.connection.status === "connecting"
            ? t("settings.connecting")
            : t("settings.connect")}
        </Button>
      </section>
      <p className="help-text">
        <CheckCircle2 size={15} />
        {t("settings.normalize")}
      </p>
      <details className="settings-guide updater-guide">
        <summary>{t("settings.updaterTitle")}</summary>
        <div className="updater-body">
          <p>{t("settings.updaterHelp")}</p>
          <span>
            {ytVersion === null
              ? t("settings.versionUnknown")
              : ytVersion === ""
                ? t("settings.versionUnavailable")
                : t("settings.version", { version: ytVersion })}
          </span>
          <Button
            disabled={
              !available || updating || snapshot.busy || snapshot.playback.status === "preparing"
            }
            onClick={async () => {
              if (!window.music) return;
              setUpdating(true);
              setUpdateResult(null);
              try {
                const reply = await window.music.updateYtDlp();
                if (reply.ok) {
                  setYtVersion(reply.version);
                  setUpdateResult(reply.updated ? "updated" : "upToDate");
                } else setUpdateResult("failed");
              } catch {
                setUpdateResult("failed");
              } finally {
                setUpdating(false);
              }
            }}
          >
            <RefreshCw size={16} className={updating ? "spinning" : ""} />
            {updating ? t("settings.updating") : t("settings.update")}
          </Button>
          <p role="status">
            {updateResult === "updated" && t("settings.updated", { version: ytVersion ?? "" })}
            {updateResult === "upToDate" && t("settings.upToDate", { version: ytVersion ?? "" })}
            {updateResult === "failed" && t("settings.updateFailed")}
          </p>
        </div>
      </details>
      <details className="settings-guide">
        <summary>{t("settings.guideTitle")}</summary>
        <ol>
          <li>{t("settings.guide1")}</li>
          <li>{t("settings.guide2")}</li>
          <li>{t("settings.guide3")}</li>
        </ol>
      </details>
    </section>
  );
}
