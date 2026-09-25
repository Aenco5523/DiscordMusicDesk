# Design research evidence

Date: 2026-09-18. Scope: design contract only; no code or visual-runtime assertions.

## Embedded reference

Source directory: `C:/Users/admin/.codex/plugins/cache/sisyphuslabs/omo/4.19.3/skills/frontend/references/`.

Shortlist from design index: Spotify, Linear, Raycast. Spotify chosen because the task's central objects are actual media, queue, transport and independent outputs. Full `design/spotify.md` read: near-black theater, persistent now-playing bar, compact typography, circle/pill controls, heavy elevated menu shadow. Adaptations: Korean Windows font stack, 14px body floor, mint functional accent, explicit separate Discord output, 1000x700 window floor. No source logo, font, asset or copy reused.

Other guidance: frontend router, design README, design-system architecture, taste-skill, layout-skill, designpowers README/routing/orchestration/lane-c-review, UI/UX database README. Marketing-only rules were treated as out of scope for an app shell.

## Network lane

Executed curl POST `https://www.lazyweb.com/api/mcp/install-token`, content type application/json, body `{}`, 20-second max time, response destination temporary file. Result: `curl: (7) Failed to connect to www.lazyweb.com:443 after 184 ms: Could not connect to server`. No token displayed. Search count 0; screenshots viewed 0. No fabricated findings.

## Concept lane

Tool catalog search exposed `image_gen__imagegen`, but no Imagen tool. The named Imagen draft lane is unavailable. No drafts generated or selected; DESIGN.md is the implementation reference. This is a research limitation, not a claim of visual QA completion.

## Database lookup

Attempt: `python .../ui-ux-db/scripts/search.py 'music streaming dark accessible' --domain color`. Result: Python command not recognized. Contrast verification is assigned to actual UI QA.

## Handoff

Build primitive states first; verify keyboard and contrast in the actual surface. Maintain an honest initial empty state and actual backend state transitions. Capture real desktop UI at the minimum and default window sizes. No external copyrighted screenshot artifact was downloaded or committed.
