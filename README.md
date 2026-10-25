# 생명 시계 연구실

버전 0.7.1 · 2026-10-25. 지훈·잎새·다람쥐 도토가 함께하는 초등 과학 탐구 게임. 전체 화면의 숲길을 걷고, 관찰·비교 실험·식물 돌봄·계절 추적·내 증거 이야기로 멈춘 숲의 시간을 잇는다.

2026-10-24 중단 작업 복구: 관찰 노트·조건 실험·시간 시계·코르크판을 연결하고 구역별 발견 미션 2개를 추가했다. 기존 완료자는 `새 발견 미션`으로 기록을 유지하며 이어갈 수 있다. [최종 점검](docs/reviews/FINAL-CHECK-20261024.md), [복구·검증 기록](docs/reviews/RECOVERY-20261024.md), [최신 인트로·아웃트로 모션 제작 자료](docs/video-production/20261024-motion/README.md).

2026-10-25 화면 고도화: 활동·지도 그림이 화면 전체를 쓰고 상단·하단 바가 그 위에 뜬다(`field-scenes.js` `hudInsets`가 바에 가리지 않는 영역을 계산해 활동을 맞춤). 카드는 종이 카드 그림, 사계절 정원은 야외 배경, 구역 로딩은 도토 지도 그림으로 바꿨고, 첫 화면은 그림을 미리 받지 않는다. [최종 점검](docs/reviews/FINAL-CHECK-20261025-2.md), [3D 모델 제작 목록](docs/3d/3D-MODEL-BRIEF.md).

수정본 0.7.1은 로컬 검토 중이며 운영에는 반영하지 않았다. 운영 배포는 `777e903` / 캐시 `a4bdb608465432edc4f6`의 0.7.0을 유지한다. 별도 승인 전까지 운영 직접 업로드를 실행하지 않는다. [이번 수정·재현·검증 보고서](docs/reviews/SCIENCE-RELIABILITY-FIX-20261025.md)에 변경 전후 동작과 미검증 항목을 정리했다.

## 실행

Node.js 20 이상. Phaser 3.90.0은 vendor에 포함돼 외부 패키지 설치나 CDN이 필요 없다.

```sh
npm start
npm run check
npm test
npm run build
npm run preview
```

기본 주소는 [127.0.0.1:4186](http://127.0.0.1:4186). 이미 사용 중이면 PowerShell에서 `$env:PORT='4202'`를 지정한다. preview는 dist만 제공한다. 정적 호스팅에는 **dist 내용만** 올린다. 공개 주소는 [life-clock-lab.pages.dev](https://life-clock-lab.pages.dev), 저장소는 [yelmovie/life-cycle-explorer](https://github.com/yelmovie/life-cycle-explorer)다.

2026-10-24 파일 정리 위치는 [프로젝트 폴더 안내](docs/PROJECT-STRUCTURE.md)에 있다. 메인·엔딩 음악은 `assets/audio/music/`, 초기 기획 문서는 `docs/planning/original/`, 참고 원본은 `reference/`, 예전 UI·스크립트·빌드는 `archive/`에 모았다. [이동 전후 대응 기록](docs/organization-20261024.json)을 보관한다.

## 다섯 탐사

| 장소 | 학생의 실제 활동 | 다음에 쓰는 보상 |
|---|---|---|
| 나비의 숲 | 움직이는 2배 돋보기로 네 모습의 서로 다른 두 부분 관찰 → 직접 그림·글 → 필름 순서 재생 → 다음 세대 연결 | 시간 손잡이 |
| 씨앗 연구소 | 같은 흙과 씨앗 준비 → 예상 → B의 조건 하나만 변경 → 0일·중간·마지막 사진 → 예상과 결과 비교. 물·온도 두 사례 | 물·빛 탐사 도구 |
| 햇살 온실 | 물·빛 측정 → 겉모습에 관찰핀 → 돌봄 전 사진 → 원인에 맞는 도구 → 시간 뒤의 변화. 두 화분 | 계절 나침반 |
| 사계절 정원 | 동물별 독립 시간, 처음·끝 사진 → 부모와 다음 세대 → 식물 이름표·겨울·다음 봄 추적 → 장미·강아지 새 사례 | 이야기 카메라 |
| 생명 시계탑 | 실제 동물·식물 증거 3~6장 선택·순서·자기 설명 → 세 도움 요청에 증거 연결 → 실제 관찰 약속 | 내 이야기·수행 기록증 PNG |

보상·완료는 증거를 검증한 뒤에만 생긴다. 잘못된 시도는 근거를 다시 보게 하며 기존 기록을 지우지 않는다. 완료한 구역은 재탐사할 수 있고, 원래 증거와 보상을 보존한다. 마지막에는 새로운 이야기로 다시 엮을 수 있다. 고정 사례의 재도전이며 무작위 문제 생성은 없다.

각 탐사를 마치면 보상 화면에서 12초 개념 모션 그래픽을 선택해 볼 수 있다. 설정의 개념 영상 목록에서는 완료한 탐사의 영상을 다시 고를 수 있다. 재생·일시정지·시간 이동·다시 보기·닫기를 제공하며, 동작 줄이기에서는 직접 재생한다. 영상 오류 때는 포스터와 핵심 설명으로 계속 진행할 수 있다. 활동 중에는 시간 바로 이동, 사진 기록 표시, 돌봄 전후 밀기 비교, 내 증거 이야기 자동 넘김을 사용할 수 있다.

## 학습 범위

2022 개정 과학과 [4과04-01~03]에 연결한다. 정확한 원문은 설정의 교사용 가이드와 [경기도교육청 공개 교육과정 자료 p.20](https://www.goe.go.kr/resource/goe/na/bbs_2675/2025/07/f4c15fac-ae7b-46aa-8e16-b8d86b710d44.pdf)에 있다.

화면은 **관찰·실험 모형**이다. 실제 사육·재배의 지속적인 직접 관찰을 대신하지 않는다. 발아의 물·온도 조건과 자라는 식물의 물·빛 조건을 구분하며, 동물별 실제 성장 기간과 식물 회복 속도는 서로 다를 수 있다. 자유 서술의 과학적 타당성은 자동 채점하지 않으므로 교사가 증거와 함께 확인한다.

## 설정과 저장

우측 설정에서 배경 음악·효과음·음량, 도입 이야기, 완료 후 엔딩·기록증, 기록함·가방, 학생·교사 가이드, 전체 구역 미리보기, 출처, 초기화를 이용한다. 첫 조작 전에는 소리가 재생되지 않는다. 도토를 누르면 현재 활동의 단계별 단서와 조작 위치를 볼 수 있다.

배경 음악을 켜면 사용자 제공 ‘The Garden Blooms’가 첫 화면·탐험에서 반복 재생된다. 엔딩·기록증에서는 ‘Rising Motif’로 바뀌어 한 번 재생하고, 닫으면 메인 곡으로 돌아온다. 개념 영상과 숨겨진 탭에서는 음악을 멈춘다. 같은 플레이어를 재사용하며 곡을 겹쳐 재생하지 않는다. 음량·켜기 상태는 기존 설정을 따른다.

브라우저의 `life-clock-lab.phaser.4`에 자동 저장한다. 기존 v2/v3 탐구·0.5 의뢰 기록은 보관하고 새 탐사는 독립된 `field`에 기록한다. 예전 완료를 새 수행으로 만들지 않는다. 교사 시연은 학생 상태의 임시 복사본이다. 켜면 모든 구역이 열린 지도로 이동하며, 구역 위쪽 활동 단계 선택에서 30개 활동을 시연용 예시로 바로 열 수 있다. 예시는 학생의 완료·보상·기록을 만들지 않으며 종료·새로고침 시 원래 학생 상태로 돌아간다. 초기화에는 확인 단계가 있고 소리 설정은 유지한다.

포트·도메인·브라우저가 달라지면 저장 공간도 달라진다. 기록함의 진행 JSON 보관과 PNG를 이용할 수 있다. JSON 불러오기 UI는 제공하지 않는다. 서버 전송·계정·학생 명단 수집은 없다.

## 코드 안내

| 파일 | 역할 |
|---|---|
| game-app.js / field-preview.js | 입력 연결, 지도·탐사·모달 흐름, 자동 저장, 임시 교사 시연 |
| content/field-missions.json / field-mission-data.js | 구역·추가 발견 안내 원본 / 명령 실행 때 생성하는 정적 데이터 |
| game-bootstrap.js / game-shell.css | 첫 로딩 진행률과 엔진·모듈 실패 시 다시 열기 |
| game-network.js / scripts/service-worker-template.js | 연결 안내, 배포본의 버전별 오프라인 준비·갱신 |
| field-model.js | 증거·완료·재도전·저장 복원 검증, 12종 실제 기록 |
| field-content.js / field-flow.js | 장소·문제·보상·도움말, 증거로 계산하는 진행 단계 |
| field-scenes.js / field-room-scenes.js | Phaser 숲길, 렌즈·그림·드래그·회전·생물 변화·실제 기록 사진 |
| field-dialogs.js / field-record-art.js / field-certificate.js | 학생 문장 편집, 실제 조건·사진·그림 출력, 기록증 |
| game-model.js | 이전 탐구 자료 보존과 새 상태 연결, 지도 경로 |
| game-records.js / adventure-export.js | 실제 기록 이미지, 독립 PNG 출력 |
| game-settings.js / settings-content.js / game-audio.js | 아이스크림 설정 규격, 문구, 단일 Web Audio 관리·CC0 효과음 |
| game.css / ui-icons.js | 디자인 토큰, 로컬 Jua, 전체 화면·반응형, SVG 아이콘 |
| scripts/build.mjs / check.mjs / sync-info.mjs | 실행 파일·필수 에셋만 패키징, 문법·버전 동기화 |

기존 game-scenes.js·expedition-scenes.js와 app/adventure/inquiry의 예전 UI는 `archive/legacy-ui/`에 보관하며 현재 실행·배포 대상에서 제외한다. inquiry-core.js·expedition.js·adventure-core.js는 예전 저장 자료 검증 때문에 계속 필요하다. 구역명·질문·목표·보상 안내와 추가 발견 미션의 이름·안내 문장은 `content/field-missions.json`에서 수정한다. `npm start`, `npm run check`, `npm test`, `npm run build`가 `scripts/sync-info.mjs`로 데이터 형식을 검사하고 `field-mission-data.js`를 만든다. 생성 파일은 직접 고치지 않는다. 정답·완료 조건·모델은 로직 파일에 유지한다.


## 로딩과 오프라인 수업

첫 방문에는 연결이 필요하다. 초기 화면은 엔진·숲 그림을 먼저 가져오고, 각 구역의 그림은 입장할 때 불러온다. 준비 화면에서 진행률을 볼 수 있고 엔진이나 실행 모듈을 받지 못하면 다시 열기 버튼이 나온다. 로컬 서버는 HTML·JS·CSS·SVG를 Brotli/gzip으로 압축한다. 정적 호스팅에서는 호스팅 서비스의 압축 설정을 사용한다.

`npm run build`로 만든 dist만 오프라인 준비를 사용한다. 화면이 열린 뒤 약 17.19 MiB의 배포 자료(글꼴·그림·영상·소리 포함)를 배경에서 저장하며, 내용 해시가 모두 맞는 경우에만 준비 완료를 알린다. 이 안내를 확인한 뒤에는 연결이 끊겨도 다음 탐사·기록·영상·새로고침을 이어갈 수 있다. HTTPS 또는 localhost 환경이 필요하며, 브라우저가 사이트 데이터를 지웠거나 캐시 공간을 회수한 경우에는 연결된 상태에서 다시 준비해야 한다. 교실에서는 수업 전에 기기마다 준비 완료를 확인한다. 첫 다운로드의 통신량은 기기 수만큼 늘어난다.

학생의 `localStorage` 기록과 오프라인 자료의 `CacheStorage`는 별개다. 앱 초기화는 학생 기록만 다루며, 캐시 갱신은 학생 기록을 수정하지 않는다. 새 배포는 파일별 검증을 마친 후 대기하고, 탐험 창을 모두 닫고 다시 열면 적용한다. 작성 중인 창을 강제로 새로고침하지 않는다. 개발 서버의 `offline-config.json`은 비활성 상태라 수정 중인 소스가 서비스워커에 고정되지 않는다.

## 내용 변경과 스테이지 확장

현재 게임은 다섯 구역으로 설계되어 있다. 문장만 바꿀 때는 JSON 원본의 `chapters`와 `discoveries`에서 같은 항목의 문자열을 수정하고 `npm run check && npm test && npm run build`를 실행한다. 각 구역의 `art`와 `guide`는 `game-assets.js`에 있는 키를 유지한다. `chapters`와 `discoveries`는 각각 5개, 추가 발견의 `steps`와 `objectives`는 각각 2개여야 한다. 빌드는 문장이 비었거나 개수가 맞지 않으면 중단한다.

기존 구역 안에 새 활동 사례를 넣는 순서는 다음과 같다.

1. `field-model.js`의 `initialField`에 저장 상태를 추가하고 `restoreField`에서 이전 저장에 그 값이 없어도 복원되게 한다. `fieldReady`와 `fieldAction`에는 실제 증거와 오답 조건을 정의한다. 단순 화면 방문을 완료 증거로 만들지 않는다.
2. `field-flow.js`의 `roomPhase`에 새 활동의 위치를 넣고 `roomUI`에서 목표·버튼·다음 동작을 연결한다. `field-companion.js`에는 단계 이름·힌트·조작 위치를 추가한다.
3. `field-room-scenes.js`에서 해당 구역 렌더러로 연결한다. 관찰은 `field-observation-scenes.js`, 실험·돌봄·계절은 `field-plant-scenes.js`, 이야기는 `field-story-scenes.js`에 구현한다. 사용하는 그림은 `game-assets.js`와 `fieldRoomAssets`에 등록하고 키보드용 `focusTargets`도 제공한다.
4. 추가 발견 과제라면 `field-quest-state.js`의 복원·완료 증거와 `field-quests.js`의 행동 검증·렌더링을 함께 바꾼다. 문구는 JSON 원본에서 수정한다. 사진·그림을 내보낼 때는 `fieldRecords`, `field-record-art.js`, `field-certificate.js`에서 실제 기록을 읽도록 연결한다.
5. `field-preview.js`의 시연용 상태와 `tests/field-preview.test.js`의 단계 목록을 맞춘다. 관련 모델 검사에 정답·오답·새로고침 복원 경로를 포함하고 브라우저에서 시작→활동→기록→보상→다시 열기를 확인한다.

새로운 여섯 번째 구역을 추가하는 경우에는 위 절차에 더해 저장 구조와 다섯 구역의 경계를 확장해야 한다. `game-model.js`의 저장 형식 검사, `field-model.js`의 초기화·복원·해금·완료, `game-app.js`의 구역 배열·입장 범위·마지막 구역 처리, `field-quest-state.js`와 `field-preview.js`의 구역 분기, `field-dialogs.js`·`field-certificate.js`의 완료·증명서 표시를 함께 점검한다. `game-model.js`의 `POINTS/EDGES/DOORS`에 새 길과 문을 추가하고 `field-scenes.js`의 지도 위치를 확인한다. `scripts/sync-info.mjs`의 구역 수 검사도 함께 변경한다. JSON에 항목만 덧붙여서는 새 구역이 생기지 않는다.

새 실행 파일을 만들면 `scripts/build.mjs`의 `required`, `scripts/check.mjs`, `server.mjs`의 허용 파일 목록에도 등록한다. 에셋은 런타임의 명시적 `assets/...` 경로에서 빌드가 수집한다. `npm run build` 뒤 dist를 별도 포트에서 열어 오프라인 준비→연결 차단→새 활동→새로고침까지 확인한다. 빌드는 원본·예전 UI·이전 빌드를 배포에 넣지 않는다.

## 검증

자동 검사 162개, 활성 런타임·빌드 문법 42파일(2026-10-25). 빈 상태부터 다섯 구역을 실제로 완주하고 오답·사진·글·그림·증거 연결·PNG 두 종류·새로고침을 확인했다.

- UI: 6개 화면 크기에서 84개 대표 상태와 추가 18개 상태를 점검했다. 작은 알을 중심에서 22 CSS px 떨어진 곳에서 잡아 끄는 렌즈 입력, 화면 회전 후 기록 보존도 확인했다.
- 교사 시연: 30개 활동의 진입·단계 전환과 학생 기록 보존을 확인했다.
- 미디어·저장: 개념 영상 5편의 재생과 목록 복귀, 저장 오류·충돌·원문 보호 8개 시나리오를 확인했다.
- 오프라인: 준비 완료 후 연결을 차단한 새 학생 상태에서 다섯 구역·추가 발견 10개·개념 영상 5편·PNG 출력·새로고침 복원까지 완주했다. 새 배포의 대기·적용·실패 복구 3개 시나리오도 통과했다.

[최종 점검 결과](docs/reviews/FINAL-CHECK-20261024.md), [UI 검증](docs/reviews/UI-DESIGN-FINAL-20261024.md), [기술 검증](docs/reviews/FINAL-TECH-CHECK-20261024.md)에 근거를 정리했다. 브라우저 에뮬레이션이며 실제 학교 태블릿·전자칠판·30명 동시 학교망은 미검증이다. 10Mbps·지연 60ms 모사의 초기 준비 시간은 3.124초로, 로딩 경고 1개를 남겼다.

추가 교실 UI·미디어 검증은 `node scripts/qa-field-play.mjs` 실행 뒤 `npm run check:classroom`으로 실행한다. `BASE_URL`로 실행 중인 서버를 지정할 수 있다.

선택적 Chrome/Playwright 검증:

```sh
node scripts/qa-field-play.mjs
node scripts/qa-field-regression.mjs
node scripts/qa-field-touch.mjs
```

서버는 BASE_URL로 지정한다(기본 개발 4202 / touch는 dist 4204). 필요하면 PLAYWRIGHT_MODULE에 설치 경로를 지정한다. play가 만든 격리 QA 저장본을 regression/touch가 레이아웃·재도전용으로 사용한다. 산출물은 .tmp에 있으며 사용자 브라우저를 건드리지 않는다.

[최신 인트로·아웃트로 모션 제작 자료](docs/video-production/20261024-motion/README.md) · [최종 점검](docs/reviews/FINAL-CHECK-20261024.md) · [이전 영상·UX 개선](docs/CLASSROOM-MEDIA-20261022.md) · [이전 개선 기록](docs/FIELD-ENHANCEMENT-20261021.md) · [에셋 검토](docs/ASSET-REVIEW-20261020.md) · [라이선스](assets/CREDITS.md) · [이전 제작기](docs/PHASER-IMPLEMENTATION-20261018.md)

입장 동작 후속 수정과 내장 브라우저 직접 확인: [검증 기록](docs/reviews/STAGE-ENTRY-20261021.md).

## Cloudflare 배포

[생명 시계 연구실](https://life-clock-lab.pages.dev) · Cloudflare Pages 프로젝트 `life-clock-lab`, 운영 브랜치 `main`.
Wrangler 4가 설치되고 계정이 연결된 환경에서 실행한다. `dist` 안의 실행 파일만 공개되고 제작용 원본·검증 자료는 웹 배포에서 제외된다.

```sh
npm run build
wrangler pages deploy dist --project-name life-clock-lab --branch main
```

현재는 직접 업로드 배포다. GitHub 푸시만으로 자동 배포되지는 않는다.
교사 시연은 같은 탭의 새로고침 뒤에도 해금과 선택한 활동이 유지되며, 학생 원본 기록과 분리된다. 시연을 끄면 학생 원래 진행으로 돌아간다.
[최신 화면·해금 검증](docs/reviews/RESPONSIVE-20261025.md).

## 콘텐츠 간략 소개

초등 3학년 과학 「생물의 한살이」를 바탕으로 한 퀘스트형 디지털 과학 탐구 게임이다. 학생은 지훈·잎새·도토와 다섯 탐사 구역을 돌며 나비의 성장 과정, 씨앗이 싹트는 조건, 식물 돌봄, 계절에 따른 생물의 변화를 관찰하고 비교한다. 직접 남긴 사진·그림·글을 연결해 멈춘 숲의 시간을 되살리고, 나만의 생명 기록 이야기와 탐험 기록증을 완성한다.
