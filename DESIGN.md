# Discord Music Bot GUI Design System

## 0. Research Log

- Embedded references: shortlisted Spotify (music hierarchy), Linear (operational density), and Raycast (desktop controls). Selected `taste-skill.md` and `spotify.md` from the installed frontend reference library. The operational app uses the latter's content-first charcoal surfaces, circular transport, persistent player, and restrained functional accent; marketing-only taste rules do not apply to this desktop tool. Full Spotify reference read; additional app-shell and designpowers routing/review guidance consulted.
- Lazyweb: anonymous token request attempted on 2026-09-18 using the documented endpoint and curl. Connection failed with curl exit 7. Zero search queries completed; zero screens viewed. No external screenshot-derived findings are claimed.
- Imagen concept drafts: skipped because no Imagen tool is exposed in this session. The available image_gen tool is a different tool. No generated mockup or pixel-fidelity promise exists; this written contract governs implementation.
- UI/UX database: attempted `music streaming dark accessible` color lookup; default `python` command unavailable. Palette derives from the embedded music reference and must be contrast-checked in the built UI.
- Research evidence: `docs/design/research.md`. No third-party screenshots, proprietary fonts, logos, or fake playable catalog content are included.

## 1. Atmosphere & Identity

A practical Korean desktop listening room: quiet charcoal framing lets the current video lead, with a slim navigation rail and a clearly separated queue. The recognizable moment is one large circular mint play control below the video, beside two explicitly labeled output levels. Depth comes from tonal surfaces and recessed controls rather than decorative glow. This is a music utility, not a marketing page. Design variance 3, motion intensity 2, density 6.

The Windows app icon uses the same charcoal and mint tokens: a headphone silhouette enclosing a play symbol, kept readable at taskbar sizes.

Primary task order: configure bot once, connect to Discord, enter a voice channel ID, join, add a real media URL, play and manage the queue. Secondary task: adjust PC playback independently of Discord output. Labels must describe actual runtime state. A disconnected bot never appears connected; an unresolved URL never becomes a fake playable track.

Content jobs: sidebar navigates; connection header explains destination and status; video shows current media; queue retains upcoming intent; bottom transport controls playback; settings explains and saves connection configuration. Korean is the default UI language, with product names and technical identifiers retained where necessary.

## 2. Color

Dark only for this release; no incomplete light mode.

| Token | Value | Usage |
|---|---|---|
| `--surface-base` | `#101112` | Window canvas and sidebar |
| `--surface-main` | `#18191B` | Workspace and queue |
| `--surface-raised` | `#222427` | Controls, settings groups |
| `--surface-hover` | `#2C2F32` | Interactive hover |
| `--surface-media` | `#080909` | Empty video theater |
| `--text-primary` | `#F5F6F6` | Titles and body |
| `--text-secondary` | `#B7BBBF` | Supporting copy |
| `--text-muted` | `#90969C` | Nonessential metadata |
| `--text-on-accent` | `#092419` | Mint button text/icons |
| `--accent` | `#76D9AE` | Play, join, selected control |
| `--accent-hover` | `#9AE8C4` | Primary hover |
| `--accent-pressed` | `#51BA8D` | Primary pressed |
| `--accent-subtle` | `#203C31` | Selected row background |
| `--border` | `#3B3F44` | Region separation |
| `--control-border` | `#737A82` | Visible input/range boundary |
| `--focus` | `#BBF3D8` | Keyboard focus ring |
| `--error` | `#FF969F` | Error copy/icon |
| `--warning` | `#EDC078` | Interrupted/reconnecting state |
| `--success` | `#76D9AE` | Confirmed connection |
| `--scrim` | `rgba(0,0,0,.6)` | Modal backdrop |

Semantic colors always accompany text or an icon. Mint is functional, not a background wash. Disabled controls use reduced emphasis plus native disabled semantics; required explanations retain readable secondary text.

## 3. Typography

Primary/display: `"Segoe UI", "Malgun Gothic", system-ui, sans-serif`. Mono for times/IDs only: `Consolas, monospace`. Use installed Korean fallbacks; no remote font request and no proprietary reference fonts. Body letter spacing is normal; never add wide tracking or uppercase transforms to Korean.

| Token | Size / line height | Weight | Job |
|---|---|---|---|
| `--type-title` | 24px / 32px | 700 | Settings page title |
| `--type-heading` | 18px / 26px | 700 | Current media/queue heading |
| `--type-body` | 14px / 22px | 400 | Labels, fields, explanation |
| `--type-control` | 14px / 20px | 600 | Buttons/navigation |
| `--type-caption` | 12px / 18px | 400 | Time and secondary metadata only |

Long media titles clamp visually to two lines with full accessible names and title tooltips. Error messages wrap. Never shrink body copy to fit a fixed row. Time uses tabular numerals.

## 4. Spacing & Layout

Spacing tokens: `--space-1:4px`, `--space-2:8px`, `--space-3:12px`, `--space-4:16px`, `--space-5:20px`, `--space-6:24px`, `--space-8:32px`, `--space-10:40px`, `--space-12:48px`, `--space-16:64px`.

Geometry tokens: `--sidebar-width:76px`; `--header-height:84px`; `--transport-height:128px`; `--queue-width:320px`; `--queue-compact-width:280px`; `--control-height:40px`; `--icon-button:40px`; `--play-button:52px`; `--queue-row-min:64px`; `--radius-small:6px`; `--radius-panel:12px`; `--radius-pill:999px`; `--icon-size:20px`; `--focus-width:2px`; `--focus-offset:3px`.

Window default 1320x860, minimum 1000x700. Root shell bounded to 100dvh, columns sidebar + minmax(0,1fr). Workspace rows connection header + minmax(0,1fr) body + transport. Main body columns minmax(0,1fr) + queue. At 1000–1159px use compact queue width and 16px page padding; at 1160px and above use 320px queue and 24px padding. The desktop video theater takes the remaining body height after its eyebrow, title, and setup guidance. It may letterbox in either direction; the video preserves its intrinsic aspect ratio with contain fitting and never crops. Sidebar, channel controls, title, and transport stay visible on one screen, including wide, short windows. Below 900px the flowing browser harness retains a 16:9 frame.

Scroll ownership: queue list owns its vertical scroll; settings body owns settings scroll. All grid/flex shrinking children use min-width:0 and min-height:0. The desktop media panel does not scroll: its media frame flexes with min-height:0 while titles and guidance retain their natural height. At heights up to 760px, vertical spacing reduces to existing 8/12/16px tokens; settings cards use 16px padding and 12px gaps. Enlarged text that triggers the narrow reflow uses natural document scrolling so controls remain reachable. Do not place the whole application in an unbounded document scroll. Queue header/add controls remain outside its scroll list. Strings such as media URLs wrap anywhere in errors/settings.

Browser/primitive harness at 375px and 768px reflows to one column, text navigation, stacked connection controls, video then queue, and naturally flowing transport. This supports accessibility reflow/testing; the packaged desktop window still enforces 1000x700 minimum.

## 5. Components

All primitives must first appear in an isolated state showcase: default, hover, pressed, focus-visible, disabled and applicable loading/empty/error. Use semantic HTML, shared tokens, and one maintained SVG icon family. Never use emoji icons or draw custom icon paths.

| Primitive | Structure / layout | States and behavior | Accessibility |
|---|---|---|---|
| AppShell / NavItem | Aside nav + main; two destinations `플레이어`, `설정` | Active mint inset/tonal state, hover, pressed, focus; settings does not stop playback | Named navigation; aria-current; icons accompanied by visible Korean labels |
| Button / IconButton | Native button; 40px minimum target; pill or circular | Primary/secondary/danger; all interaction states; loading keeps width and label | Icon-only accessible name; disabled where unavailable; busy action announces outcome |
| Field / Select | Label, input/select, help, error stack | Default, focus, invalid, disabled, loading options | Explicit label; aria-describedby; secrets masked; errors not color-only |
| StatusBadge | Icon + short text cluster | `연결 안 됨`, `연결 중`, `연결됨`, `재연결 중`, `오류` | Polite live region for changes; never announce elapsed time every second |
| ConnectionHeader | Voice channel ID text input, join/leave, status | No token points to settings; invalid/empty channel ID has inline explanation; join busy; joined exposes leave; failed join preserves entered ID | Logical focus order; voice channel ID label always visible; text input supports paste and keyboard editing |
| MediaFrame | Height-fitting desktop theater; 16:9 flowing narrow frame; media element or centered status stack | Empty `재생할 음악을 추가하세요`; loading `미디어를 불러오는 중`; ready/playing/paused; error plus retry/remove | No fabricated artwork, duration, activity or tracks; video has accessible title |
| QueuePanel / QueueRow | Heading/count + add URL form + ordered scroll list | Empty guidance; resolving row; real resolved media; active; hover; unavailable with explanation; remove and reorder actions | List semantics; explicit `위로 이동`, `아래로 이동` alternatives to dragging; remove names track |
| SeekControl | Current time + native range + duration | Disabled for no media/unknown or live duration; seeking previews target and commits deliberately | Range name `재생 위치`; keyboard arrows/Home/End; formatted aria-valuetext |
| Transport | Previous/play-pause/next cluster plus seek | Ready/playing/paused/buffering/error; absent next item disables next; unavailable playback gives reason | Names change with actual action; Space shortcut must not hijack typing or focused buttons |
| VolumeControl | Icon/mute button, explicit label, native range, percent | Two independent instances `PC 음량`, `Discord 음량`; muted/default/focus/disabled | Never identical accessible names; keyboard range; percent text; muting restores previous value |
| SettingsSection | Heading + field stack + save/connect actions | Bot token masked; saving, saved, invalid, connection error; existing secret is not echoed in status | Input labels, plaintext explanation of local storage behavior, focus first error after submit |
| Notice | Icon, wrapped text, optional one recovery action | Info/error/success; persistent actionable failures; transient confirmation only | Alert for blocking failures, status for success; copy excludes secrets |

Queue add placeholder: `YouTube 영상 또는 재생목록 URL`. Button `추가`. Playlist URLs append their playable videos in order, within the 200-track queue limit; unknown durations resolve when selected. Empty queue headline `재생 목록이 비어 있어요`; explanation `URL을 추가하면 여기에 표시됩니다.` Add errors preserve the input for correction. A browser preview without Electron bridge states `데스크톱 앱에서 연결할 수 있어요` and does not pretend to connect.

## 6. Motion & Interaction

`--motion-fast:120ms`, `--motion-standard:180ms`, `--motion-easing:ease-out`. No ornamental animation. Optional opacity transitions only for state changes; pressed buttons may translate by 1px. Native media/range feedback is immediate. A buffering indicator runs only while backend/player reports buffering. Reduced-motion disables transforms and nonessential transitions. No shimmering skeletons required.

Keyboard sequence follows visual order: navigation, connection, add URL, queue actions, transport, output levels. Escape closes an actual modal/popover and returns focus; never disconnects or clears the queue. Removing a row returns focus to the next available row/action. Connection failures remain visible until resolved or dismissed. Repeat submission is prevented while the same action is pending.

## 7. Depth & Surface

Mixed tonal-shift + restrained shadows. The base canvas recedes behind the main surface; raised input surfaces distinguish editing. Queue separation uses a single border. Video theater uses surface-media with an inset edge. No every-row cards or glass blur. `--shadow-menu:0 8px 24px rgba(0,0,0,.5)` for menus/dialogs only; `--shadow-inset:inset 0 1px 0 rgba(255,255,255,.035)` for raised control material. Reference-derived heavy menu shadow, pill action geometry, and circular play survive adaptation; green brand logos and proprietary type do not.

## 8. Accessibility Constraints & Accepted Debt

Target WCAG 2.2 AA: text at least 4.5:1, large text and meaningful UI boundaries 3:1, visible focus, complete keyboard reachability, no color-only states, no automatic audio on launch. Maintain readable Korean at 100%, 125%, 150% and 200% scaling. Buttons have 40px targets where feasible; no target below 24px. Native ranges and selects are preferred over bespoke pointer-only controls. Focus cannot disappear behind the fixed transport. Announce connection/add errors without reading tokens or URLs containing secrets.

Inclusive walkthroughs: (1) first-time Korean user configures a bot and can identify missing prerequisites, (2) keyboard-only listener joins, adds, plays, reorders and adjusts both outputs, (3) low-vision listener at 200% can read errors and reach transport, (4) interrupted-network listener sees pending/error state without losing queued intent. These are required QA scenarios, not claims they have already passed.

Accepted debt: none. External bot credentials and a real Discord voice channel are runtime verification dependencies; lack of credentials must be reported as an evidence limit, not as successful audio QA. Primitive and screen visual QA remain implementation gates: capture actual 1000x700 and 1320x860 desktop views, narrow harness reflow, empty/loading/error states, keyboard focus, and long-title stress. A written contract is not visual verification.



2026-09-22 follow-up: desktop settings use two columns for token and connection cards. Setup guidance is an expandable details control so normal setup and normalization status fit without scrolling; expanding the guide may scroll. Main controls remain visible at1000x700.
