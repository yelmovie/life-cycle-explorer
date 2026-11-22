# 납품 안내 — 생명 시계 연구실 (2026-11-22)

기존 인계는 `HANDOFF.md`와 `docs/HANDOFF-20261026.md`에 있고, 배포 기록은 `README.md`와 `docs/reviews/`에 있습니다. 이 문서는 그 내용을 한 곳에 모은 요약이며 원래 파일은 그대로 두었습니다. (`HANDOFF.md`는 Git에서 제외된 로컬 파일이며, 그 안의 「운영 배포는 매번 승인 때만」 문구는 자동 승인으로 고쳤습니다.)

## 1. 한눈에

- 프로젝트: 생명 시계 연구실, 앱 버전 0.9.25
- 운영 주소: https://life-clock-lab.pages.dev
- 저장소: https://github.com/yelmovie/life-cycle-explorer (`main`)
- 운영에 배포된 앱 커밋: `b4cea97`(2026-11-21, Cloudflare 배포 `64e84f02`). 그 뒤 커밋은 기록 문서뿐이고 `src/`·`assets/`·`scripts/`는 같습니다.

## 2. 폴더 구조

- 배포됨: `dist/`(빌드 결과, Git에 넣지 않음). 원본은 `index.html`, `manifest.webmanifest`, `src/`, `assets/`, `content/`, `vendor/`.
- `src/`: 게임 화면·판정·저장 코드와 CSS(Phaser 기반).
- `assets/`: 그림, 영상(`video/`, `concepts/`), 음악·효과음(`audio/`), 3D(`models/`), 글꼴, 성취 카드(`reward-cards/`), `CREDITS.md`.
- `functions/`, `worker/media-range.js`: 영상 탐색 요청(Range) 처리.
- `scripts/`: 빌드·검사·배포 스크립트. `tests/`: 테스트. `server.mjs`: 로컬 서버.
- 보관용(배포 안 됨): `_source/`, `_unused/`, `archive/`, `reference/`, `docs/`, `thumbnails/`(납품 썸네일).

## 3. 실행·빌드·검사

`package.json`에서 확인한 명령입니다.

```text
npm start            # 정보 동기화 후 node server.mjs (개발 4186)
npm run check        # scripts/sync-info.mjs 후 scripts/check.mjs
npm test             # node --test tests/*.test.js
npm run build        # dist/ 생성
npm run preview      # dist 미리보기(4207)
npm run check:classroom   # 현장·미디어·팝업 점검 스크립트 3개
```

- 포트 값은 `HANDOFF.md`에서 가져왔습니다.
- 버전·정보는 `scripts/sync-info.mjs`가 맞춥니다.
- 이 Mac에는 시스템 Node가 없습니다. 외장 SSD `DevCaches/tools/`의 Node와 wrangler를 씁니다(`docs/HANDOFF-20261026.md`의 npx 캐시 문제 메모 참고).

## 4. 배포

- 호스팅: Cloudflare Pages, 프로젝트 `life-clock-lab`, 운영 브랜치 `main`. 푸시로 자동 배포되지 않습니다(`.github` 없음). 검증한 `dist/`를 직접 올립니다.
- 설정 파일: `wrangler.jsonc`(`pages_build_output_dir: ./dist`).
- 명령: `npm run release:pages`(점검만) 또는 `npm run release:pages -- --deploy`. 스크립트가 깨끗한 `main` 체크아웃인지 확인하고 `check`·`test`·`build`를 돌린 뒤 올리고, 운영 주소의 핵심 파일 해시를 빌드와 비교합니다. 직접 올릴 때는 `wrangler pages deploy dist --project-name life-clock-lab --branch main`(`docs/HANDOFF-20261026.md`).
- 영상 탐색 요청(Range): `functions/assets/video/[[path]].js`와 `functions/assets/concepts/[[path]].js`가 `worker/media-range.js`의 `mediaRange`를 부릅니다. 공통 설명은 `_shared/media-range-20261119/README.md`입니다.

## 5. 다른 호스팅으로 옮길 때

- `dist/`의 내용을 사이트 루트에 올립니다.
- 서비스 워커 `service-worker.js`(빌드가 만듦, `scripts/service-worker-template.js` 기반)를 루트에 둡니다.
- 영상(`/assets/video`, `/assets/concepts`)은 Range 요청을 처리해야 합니다. Cloudflare Pages가 아니면 `worker/media-range.js`의 방식을 호스팅에 맞게 옮겨야 합니다. `functions/`를 빼고 `dist`만 올리면 Range 처리가 빠집니다.
- 환경 값과 계정 키는 쓰지 않습니다. 진행은 브라우저 localStorage에 저장되고 서버 호출이 없습니다.

## 6. 버전과 변경 이력

- 2026-11-21 `b4cea97` 0.9.25 햇살 온실·사계절 정원 큰 화면 배경 선명도
- 2026-11-21 `fb8a910` 0.9.24 브라우저 뒤로 가기, 본문 글꼴 WOFF2
- 2026-11-21 `ce8826e` 0.9.23 잠긴 성취 카드 문구 18px, 보관함 글자
- 2026-11-21 `9e60368` 0.9.22 온실 손 조작 돌봄, `game-app.js` 분리
- 2026-11-21 `0f28e04` 0.9.21 지도 이동 버튼 색, 잠긴 카드 문구
- 2026-10-27 0.8.0 시계탑 5단계·생물 탐정 분류·새 그림 24장
- 2026-10-26 0.7.1 3D 나비 표본, `src/` 구조 이동
- 2026-10-22 0.7.0 개념 영상·도토 동행·효과음

## 7. 권리·출처

`docs/RIGHTS-LEDGER-20261121.md`에 40줄이 있습니다. 출처 미확인은 0줄이고 근거 약함 7줄이 남아 있습니다(힉스필드 그림 1줄, 앱 아이콘 SVG, Suno 음악, ElevenLabs 목소리 2줄, Qwen3-TTS 교체 대사, Meshy 3D). 요금제 화면과 결제 내역은 사용자 자료를 기다립니다.

## 8. 알려진 한계와 남은 일

`docs/reviews/SCORE-20261121.md` 기준 총점 94, 실기기 제외 98입니다.

- 실기기·수업 대기: 40분 수업 분량(B16), 실기기 터치(B19), 가장자리 제스처(C19), 저사양 태블릿(D10)
- 코드: `src/game-app.js` 60.2 KB(E2, 옮기기만으로는 40 KB에 닿지 못해 멈춤)
- 자료 대기: 권리 장부 근거 약함 7줄. 교사 검토지 「확인 필요」 6건은 교사 답을 기다립니다.
