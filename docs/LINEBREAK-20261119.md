# 문장 줄바꿈 균형 점검·수정 (2026-11-19~20)

공통 지침: `iscreammedia_sc34/_shared/LINEBREAK-BALANCE-20261119.md`. Mac, Node v24.22.2, 헤드리스 크롬(Playwright `channel: 'chrome'`). 브라우저 창 크기 검사이며 실기기(태블릿·전자칠판)는 미검증.

## 측정 방법

- 인트로: `_scratch/linebreak-audit-20261119/run.mjs 04 <주소> 18 <크기>` (버튼 자동 탐색).
- 본편 전체: `.tmp/linebreak-20261119/play-measure.mjs` — `scripts/qa-play-flow.mjs`의 전체 플레이(5구역·보상·개념 영상·지도 악당·파이널 영상·엔딩·기록증)를 복사해 화면마다 `measure.js`를 붙이고, 끝에 설정·기록 모음·기록 상세·도구 가방·초기화 확인 창을 추가로 연다. 구역 단위 체크포인트로 나눠 돌렸다.
- 크기: 1280×800, 1920×1080.

## 전/후 문제 수 (measure.js 기준, 오탐 포함 원수치)

| 구간 | 전(운영 0.9.16) 1280 | 전 1920 | 후(로컬) 1280 | 후 1920 |
|---|---|---|---|---|
| 인트로 자동 탐색 | 1 | 2 | 0 | 0 |
| 나비의 숲·씨앗 연구소 | 0 | 1 | 0 | 0 |
| 햇살 온실·사계절 정원 | 3 | 1 | 0 | 0 |
| 시계탑·엔딩·기록증·설정·가방 | 14 | 13 | 3 | 3 |
| **합계** | **18** | **17** | **3** | **3** |

후의 3+3은 모두 판정 기준상 통과다(아래 「남은 것」).

배포 후 운영(1280×800): 인트로 0, 시계탑~가방 3(같은 오탐·통과 항목). 배포 직후 주소 그대로 연 첫 측정은 엣지에 남은 옛 `index.html` 때문에 말풍선 1건이 나왔고, `?v=96af470`로 다시 열자 0이었다.

## 고친 곳

| 파일 | 내용 |
|---|---|
| `src/korean-linebreak.css` (새 파일) | 공통 규칙 그대로 복사 + 프로젝트 보정 2개 |
| `index.html` | 다른 스타일보다 먼저 `src/korean-linebreak.css` 링크 |
| `scripts/build.mjs`, `server.mjs` | 새 CSS를 배포본·오프라인 목록·개발 서버 목록에 추가(빌드 후 `dist/src/korean-linebreak.css`, `service-worker.js`, `build-manifest.json`에 들어간 것 확인) |
| `src/field-dialogs.js` | 엔딩 「관찰하고 알아낸 것」「이제 실제 생물에게 써 볼 차례야」, 기록증 두 문단의 `<br>`를 줄마다 `<span class="lb-line">`(블록)으로 바꿈. 문구는 그대로 |

공통 규칙만으로 풀린 것: 상태줄 `#status`(「…자동으로 / 기록했어.」, 「…새로 태어난 / 생명이야.」, 「…작년 그 / 나무일까?」, 「…함께 / 판단해.」), 보상 창 `.reward-text p`(「…재 / 보자.」), 잠긴 문 안내 창 문단, 엔딩 뒤쪽 두 문단, 가방 설명 `dd`, 기록 모음 카드 제목, 설정 「개념 영상 모아 보기 (선택)」 버튼.

프로젝트 보정:
- `.npc-dialogue-card [data-npc-speech] { text-wrap: balance; }` — 도토 말풍선 「…네 모습을 하나씩 / 살펴봐.」가 pretty로도 25%라 balance로.
- `.lb-line { display: block; text-wrap: balance; }` — 크롬은 강제 줄바꿈(`<br>`)이 있는 블록을 고르게 나누지 않아서, 엔딩의 「학교 화단의 봉선화 · 매주 월요일과 / 목요일」, 기록증의 「…두 식물의 겨울 / 추적」이 남았다. 줄마다 블록으로 나눠 각자 고르게 했다.

전/후 대표 스크린샷: `.tmp/linebreak-20261119/out-before-1280b-c4/08-ending.png` → `out-after2-1280/08-ending.png`, `09-certificate.png` (로컬 산출물, git 미추적).

## 남은 것(판정상 통과·오탐)

- 기록 모음 카드 「어른벌레 / 확대 관찰」, 「온도 조건 / 비교 실험」(1280): 두 줄 길이가 같다(100%). 4자 이하 규칙에 걸린 오탐.
- 도구 가방 설명 「실제 원예에서 쓰는 … / 재 보자.」(1280, 8줄 왼쪽 정렬, 끝줄 40%): 4줄 이상 긴 문단이라 통과.
- 앱 정보 「탐험 / 목적」, 「미션 / 보상」, 「남는 / 배움」(1920): 100px 칸의 두 낱말 라벨이 한 낱말씩 나뉨(100%). 오탐.
- 캔버스(Phaser) 안 글과 영상에 박힌 자막은 이번 범위 밖이라 재지 않았다.
- `scripts/qa-play-flow.mjs`(다른 세션 작업)는 측정 당시 지금 흐름과 두 군데 달랐다(「다른 화분 조사」 버튼이 안 나옴, 시계탑 완료 뒤 보상 창 없이 바로 파이널 영상). 내 측정 복사본만 고쳤고 원본은 건드리지 않았다. 그 뒤 다른 세션이 2a82abb에서 다시 썼다.

## 검증

- `npm run check`(54개 파일), `npm test` 214개 통과, `npm run build` 성공.
- 전체 플레이 측정 스크립트가 끝까지(엔딩·노트 인쇄·기록증 PNG·새로고침 복원) 오류 없이 통과.

## 운영 배포

- 커밋 96af470(origin/main) → `deploy.sh 04 "4 lifecycle" pages life-clock-lab` → https://9335c7a3.life-clock-lab.pages.dev, 운영 https://life-clock-lab.pages.dev
- `cmp.sh`: `src/field-dialogs.js`, `src/korean-linebreak.css`, `index.html` 빌드=운영 MATCH. 운영 `service-worker.js`에 새 CSS 포함 확인.
