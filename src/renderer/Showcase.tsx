import { Play, Plus } from "lucide-react";
import { emptySnapshot } from "./bridge";
import { Button, IconButton, Notice, StatusBadge } from "./primitives";

export function Showcase() {
  return (
    <main className="showcase">
      <h1>Music Desk · 컴포넌트</h1>
      <p>기본 · 마우스 오버 · 누름 · 키보드 포커스 · 비활성 상태를 확인하는 화면입니다.</p>
      <section className="settings-card">
        <h2>버튼</h2>
        <div className="settings-actions">
          <Button className="primary">
            <Plus size={16} />
            추가
          </Button>
          <Button>입장</Button>
          <Button disabled>연결 중</Button>
          <IconButton label="재생" className="play-button">
            <Play size={20} />
          </IconButton>
          <Button className="danger">삭제</Button>
        </div>
      </section>
      <section className="settings-card">
        <h2>입력</h2>
        <label htmlFor="showcase-input">음성 채널 ID</label>
        <input id="showcase-input" placeholder="17~20자리 채널 ID" />
        <label htmlFor="showcase-error">오류 상태</label>
        <input
          id="showcase-error"
          aria-invalid="true"
          aria-describedby="showcase-error-help"
          defaultValue="잘못된 ID"
        />
        <p id="showcase-error-help" className="field-error">
          17~20자리 숫자를 입력해 주세요.
        </p>
        <label htmlFor="showcase-volume">PC 음량</label>
        <input id="showcase-volume" type="range" defaultValue="75" />
      </section>
      <section className="settings-card">
        <h2>연결 상태</h2>
        <div className="settings-actions">
          <StatusBadge language="ko" connection={emptySnapshot.connection} />
          <StatusBadge
            language="ko"
            connection={{ ...emptySnapshot.connection, status: "connecting" }}
          />
          <StatusBadge
            language="ko"
            connection={{ ...emptySnapshot.connection, status: "joined" }}
          />
          <StatusBadge
            language="ko"
            connection={{ ...emptySnapshot.connection, status: "error" }}
          />
        </div>
      </section>
      <Notice language="ko" onClose={() => undefined}>
        입력값을 확인한 뒤 다시 시도해 주세요.
      </Notice>
    </main>
  );
}
