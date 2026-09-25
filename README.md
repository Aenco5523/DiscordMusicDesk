# Music Desk

Windows Electron 앱에서 YouTube 영상과 Discord 음악 봇을 함께 제어합니다.

## 실행

`release/portable/Music-Desk-0.1.0-Portable.exe`를 실행하세요. 다른 폴더로 옮겨도 이 파일 하나로 실행됩니다.

1. 설정에서 Discord 봇 토큰을 저장하고 연결합니다. 토큰은 Windows 암호화 저장소를 사용합니다.
2. 봇을 서버에 초대한 뒤 음성 채널의 보기·연결·말하기 권한을 부여합니다. 초대에는 `bot`과 `applications.commands` 범위가 필요합니다.
3. 메인에서 음성 채널 ID를 입력하고 입장합니다.
4. YouTube 영상 또는 재생목록 URL을 추가하고 곡을 선택합니다. 재생목록은 영상 순서대로 대기열에 들어갑니다. 봇과 같은 음성방의 참가자는 `/영상추가 url`로 추가할 수 있습니다.

## 재생과 음량

- PC와 Discord 음량은 각각 조절됩니다. PC를 음소거해도 Discord 출력은 유지됩니다.
- **영상별 음량 평준화가 자동 적용**됩니다. 영상 전체의 평균 음량을 측정한 뒤 -16 LUFS를 목표로 맞추고 -1.5 dBTP의 피크 목표를 사용합니다. 음악의 구성·다이내믹 차이 때문에 모든 순간이 같은 크기로 들리지는 않습니다.
- PC와 Discord가 동일한 평준화 파일을 사용합니다. 영상 스트림은 재인코딩하지 않습니다.
- 최초 준비에는 다운로드와 두 차례의 오디오 처리가 필요합니다. 이후에는 캐시를 사용합니다. 기존 캐시도 새 평준화 버전으로 다시 준비됩니다.
- 2시간 이하, 최종 1GB 이하의 공개 일반 영상이 대상입니다. 실시간·비공개·제한된 영상은 지원하지 않습니다.
- 대기열은 최대 200곡입니다. 200곡을 넘는 재생목록은 일부만 추가하지 않고 오류를 표시합니다.
- 메인 조작부는 최소 1000×700 창에 맞춰집니다. 긴 재생목록 및 펼친 설정 도움말은 내부 스크롤을 사용합니다.

## 개발 및 검증

Node 22.12 이상과 pnpm을 사용합니다.

```sh
pnpm install
pnpm build
pnpm start
pnpm typecheck
pnpm test
pnpm package:win
node scripts/qa-player.cjs "release/portable/win-unpacked/Music Desk.exe"
```

`vendor`에는 Windows용 yt-dlp와 FFmpeg가 있습니다. 출처·라이선스는 `vendor/PROVENANCE.md`를 확인하세요. 현재 출력물은 서명되지 않은 로컬 실행용 빌드입니다.

2026-09-22 검증: 실제 YouTube 영상 추가·첫 재생·PC 오디오 출력·바 클릭 및 키보드 탐색·일시정지·재실행·세 가지 창 크기의 메인 배치 통과. `evidence/qa-player.json` 참고. 실제 Discord 음성방 송출은 이번 변경에서 재검증하지 않았습니다.

2026-09-24 검증: 공개 YouTube 재생목록 3곡이 패키지 앱에서 순서대로 추가됨. 새 아이콘을 포터블 EXE에서 추출해 확인했고, 포터블 EXE를 일반 Windows 실행으로 열어 메인 창이 표시되는 것을 확인했습니다. `evidence/playlist-packaged.png`와 `evidence/icon-final-portable.png` 참고.
