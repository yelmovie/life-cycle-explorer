# 권리 장부 · 생명 시계 연구실 (2026-11-21)

운영 빌드에 들어가는 그림·영상·음악·효과음·목소리·글꼴·3D 모델의 출처와 이용 조건을 한 표로 모았다. 기록에 적힌 내용만 옮겼고, 추측으로 채운 칸은 없다. 그림은 만들지 않았고 저장소의 다른 파일도 고치지 않았다.

- 배포 목록 기준: `dist/build-manifest.json`(2026-11-20 21:51 UTC 빌드). 파일 374개 중 `assets/` 298개 = 미디어 294개 + 라이선스 고지 txt 4개(`audio/KENNEY-INTERFACE-LICENSE.txt`, `audio/KENNEY-IMPACT-LICENSE.txt`, `fonts/NanumSquareNeo-OFL.txt`, `fonts/NanumPenScript-OFL.txt`). 지금 작업 트리에서 `node scripts/build.mjs --dry-run`을 돌려도 에셋 294개로 같다(dry-run은 목록을 찍지 않아 개수만 대조했다). 라이브러리 2개(`vendor/`)도 함께 적었다.
- 찾아본 곳: `assets/CREDITS.md`, `assets/README.md`, `assets/**/manifest.json`·`*-generation.json`·`provenance.json`·`README*`, `docs/`의 생성·음성 기록, `vendor/*LICENSE*`, git 커밋, 공유 폴더 `/Volumes/T7 Shield/iscreammedia_sc34/_shared/`(아래 `_shared/`). 저장소·공유 폴더에 없을 때만 작업 폴더 `/Volumes/T7 Shield/iscreammedia_sc34/_scratch/`(아래 `_scratch/`)를 봤다.
- 경로는 저장소 루트 기준이다. 「assets/」를 뺀 짧은 경로는 `assets/` 아래다.

상태 기준:

- **확인됨**: 만든 곳·날짜가 생성 기록(생성 ID·프롬프트), 라이선스 원문, 계정 조회 기록 중 하나로 남아 있고, 이용 조건의 근거(라이선스 원문, 약관 링크, 계정 조회)도 있다.
- **근거 약함**: 만든 곳은 적혀 있지만 생성 기록이 없거나, 이용 조건이 사용자 말로만 확인됐거나(요금제 화면·영수증 없음), 기록이 저장소 밖 작업 폴더에만 있다.
- **출처 미확인**: 만든 곳을 적은 기록을 못 찾았다.

## 상태별 개수

| 상태 | 줄 | 배포 파일 |
|---|---:|---:|
| 확인됨 | 26 | 264 (+ 라이브러리 2) |
| 확인됨(사용자 확인) | 5 | 15 |
| 근거 약함 | 8 | 15 |
| 출처 미확인 | 0 | 0 |
| 합계 | 39 | 294 (+ 라이브러리 2) |

L34·L35는 L26과 같은 영상 파일 2개 안의 소리라서 파일 수를 따로 세지 않았다.

## 장부

### 그림/배경

| 번호 | 파일(묶음) | 종류 | 만든 곳(생성 도구·제공처·라이브러리) | 만든 날·기록 위치 | 이용 조건 | 근거 파일 경로 | 상태 |
|---|---|---|---|---|---|---|---|
| L01 | `expedition/forest-world.webp`, `expedition/forest-world-title.webp` (지도·첫 화면 배경, 2개) | 그림/배경 | OpenAI 내장 image_gen. `-title`은 같은 그림을 다시 압축한 복사본 | 2026-10-18, 생성 ID `exec-007e3ef1…`, 프롬프트 원문 | OpenAI 이용약관 Content 항목(CREDITS 2026-10-21 도구표의 링크). 계정·요금제 증빙은 저장소에 없음 | `assets/expedition/generation.json`, `assets/expedition/manifest.json`, `assets/CREDITS.md`(0.5.0 절, 2026-10-25 절) | 확인됨 |
| L02 | `field/observation-clearing.webp` (나비의 숲 배경) | 그림/배경 | OpenAI 내장 image_gen | 2026-10-21, 생성 ID `exec-2b86d132…`, 프롬프트 `field/prompt.txt` | L01과 같음 | `assets/field/manifest.json`, `assets/field/prompt.txt`, `assets/CREDITS.md`(도구표) | 확인됨 |
| L03 | `game/seed-lab-greenhouse-v2.jpg` (씨앗 연구소 배경, 1920×819) | 그림/배경 | 내장 image_gen(Codex). 생성 PNG를 JPEG(품질 87)로 바꾼 파일 | 2026-11-15 09:28 KST(00:28 UTC), Codex 세션 `rollout-2026-11-15T01-02-51-01a1dacc…`의 이미지 생성(「environment art only for the Seed Lab chapter …」), 생성 원본 `exec-bb2a6bd7…png` → `cp` `seed-lab-source.png` → `sips -s format jpeg -s formatOptions 87` → 이 파일, 3분 뒤 커밋 `abe872e`. 3-2a단계에서 `_shared/CODEX-IMAGE-RECORDS-20261121.md` 방법으로 찾음 | L01과 같음 | `_shared/codex-image-records-20261121/index.jsonl`(2026-11-15T00:28:31Z 줄), 위 세션 기록(읽기만) | 확인됨 |
| L04 | `game/bg4.webp` (햇살 온실 배경), `game/bg8.webp` (배포되지만 화면에서 쓰는 곳을 못 찾음, 아래 「눈에 띈 점」) | 그림/배경 | 사용자가 준 「ChatGPT Image 2026년 9월 23일 오후 …」 파일(scene-05, scene-09)을 줄인 사본 | 2026-09-23(원본 파일명), 대응표 `assets/README.md`, 줄인 기록 `game/manifest.json` | CREDITS: 「제공 주체와 권리자 이름·플랫폼 이용 조건은 별도 확정 필요」 | `assets/README.md`, `assets/game/manifest.json`, `assets/CREDITS.md`(2026-10-18 이전 제작 이력) | 확인됨(사용자 확인) — 사용자 확인(2026-11-21 09:25 「전부 맞아」: 그림은 전부 Codex·GPT 이미지, 유료 요금제). 원본 이름 「ChatGPT Image …」와 어긋나지 않음 |
| L05 | `field/garden-seasons-v1.webp` (사계절 정원 배경) | 그림/배경 | 힉스필드 `gpt_image_2_5` | 2026-10-25, 원본 `field/source/garden-seasons-20261025.png`. 생성 ID·프롬프트 기록 없음 | 요금제·상업 이용 문구 없음 | `assets/CREDITS.md`(2026-10-25 화면 고도화 그림), `docs/HANDOFF-20261026.md` 24행 | 근거 약함 |
| L06 | `game/tower-room-sleep.webp`, `game/tower-room-awake.webp`, `game/tower-evidence-board.webp`, `game/ending-forest.webp` (시계탑 배경·증거판·엔딩 숲, 4개) | 그림/배경 | 내장 image_gen(Codex, 원본 경로 `.codex/generated_images`) | 2026-10-26, 그림별 생성 ID(`exec-4a332016…` 등), 원본 PNG `_source/original-png/` | L01과 같음 | `docs/image-generation-tower-20261026.json`, `assets/CREDITS.md`(2차 그림 주문 17·18·21·24번) | 확인됨 |
| L07 | `game/` 생물·도구·화분·계절 그림 38개: apple, appleSpring, appleSummer, balsam, balsamDry, balsamSeeds, balsamSprout, butterfly, camera, caterpillar, chicken, chrysalis, clock, core, dry, egg, frog, lamp, lever, lightSensor, magnifier, moistureSensor, pale, pot0~3, ring, season, seed0~3, shade, soil, vessel, watercan, winter | 그림 | OpenAI image_gen(`generated/`·`adventure/` 원본을 줄인 사본) | 원본 2026-10-15(코드 BIO-·M04~M10·ADV-), 줄인 기록 2026-10-18 | L01과 같음 | `assets/game/manifest.json`, `assets/generated/manifest.json`·`prompts.json`, `assets/adventure/manifest.json`·`prompts.json`·`scene-prompts.json`·`science-prompts.json` | 확인됨 |
| L08 | `game/pale-recover-1.webp`, `pale-recover-2.webp`, `dry-recover-1.webp`, `thermometer.webp`, `heat-mat.webp`, `watercan-pour.webp`, `field-camera.webp`, `photo-frame.webp` (온실·연구소·기록 소품, 8개) | 그림 | 내장 image_gen(Codex) | 2026-10-26, 그림별 생성 ID(`exec-65857991…` 등), 원본 `_source/original-png/` | L01과 같음 | `docs/image-generation-20261026.json`, `assets/CREDITS.md`(2차 주문 1~8번) | 확인됨 |
| L09 | `game/sort-*.webp` (생물 분류 카드 8개) | 그림 | 내장 image_gen(Codex) | 2026-10-26, 그림별 생성 ID | L01과 같음 | `docs/image-generation-sort-cards-20261026.json`, `assets/CREDITS.md`(2차 주문 9~16번) | 확인됨 |
| L10 | `game/tower-emblem-0~3.webp`, `tower-gear-large/medium/small.webp`, `tower-bell.webp`, `tower-medal.webp` (시계탑 소품 9개) | 그림 | 내장 image_gen(Codex). 문장·톱니는 한 장을 잘라 나눔 | 2026-10-26, 생성 ID | L01과 같음 | `docs/image-generation-tower-20261026.json`, `assets/CREDITS.md`(2차 주문 19·20·22·23번) | 확인됨 |
| L11 | `field/dog-newborn-v1.webp`, `dog-juvenile-v1.webp`, `dog-adult-v1.webp` (개 3단계) | 그림 | 내장 image_gen | 2026-10-24, 프롬프트 원문 | L01과 같음 | `assets/field/dog-life-generation.json`, `assets/CREDITS.md`(2026-10-24 관찰 도구·생물) | 확인됨 |
| L12 | `field/leaf-isolated-v1.webp`, `field/rose-shrub-v1.webp` | 그림 | 내장 image_gen | 2026-10-24, 프롬프트 원문 | L01과 같음 | `assets/field/science-recovery-generation.json`, `assets/CREDITS.md` | 확인됨 |
| L13 | `field/observation-lens-v1.webp`, `field/research-notebook-v1.webp` | 그림 | 내장 image_gen | 2026-10-24, 생성 ID `exec-cad07cec…` 등 | L01과 같음 | `assets/field/observation-notebook-generation.json`, `assets/CREDITS.md` | 확인됨 |

### 캐릭터

| 번호 | 파일(묶음) | 종류 | 만든 곳 | 만든 날·기록 위치 | 이용 조건 | 근거 파일 경로 | 상태 |
|---|---|---|---|---|---|---|---|
| L14 | `game/jihoon.webp`, `think.webp`, `cheer.webp`, `ipsae.webp`, `ipsaeCheer.webp`, `walk.webp` (지훈·잎새·지도 걷기 시트, 6개) | 캐릭터 | OpenAI image_gen(`adventure/` 원본을 줄인 사본, 코드 CHAR-J-01~03·CHAR-L-01~02·CHAR-MAP) | 원본 2026-10-15, 줄인 기록 2026-10-18 | L01과 같음 | `assets/game/manifest.json`, `assets/adventure/manifest.json`·`prompts.json` | 확인됨 |
| L15 | `expedition/guideLook/Care/Time/Story.webp` (지훈 동작 4개) | 캐릭터 | OpenAI 내장 image_gen(`jihoon-actions.png`를 4칸으로 자름) | 2026-10-18, 생성 ID | L01과 같음 | `assets/expedition/generation.json`, `assets/expedition/manifest.json` | 확인됨 |
| L16 | `field/doto.webp` (도토) | 캐릭터 | OpenAI 내장 image_gen | 2026-10-22, 프롬프트·출력 ID·해시, 원본 `field/source/doto-20261022.png` | L01과 같음 | `assets/field/doto-generation.json`, `assets/CREDITS.md`(0.7.0) | 확인됨 |
| L17 | `field/map-villain-left-v2.webp`, `map-villain-right-v2.webp`, `map-hero-reaction-v2.webp`, `map-ally-reaction-v2.webp` (지도 전투 스프라이트 4개) | 캐릭터 | 「기존 외형을 참고해 새로 그렸다」고만 적혀 있고 도구 이름이 없다 | 2026-11-14, git 커밋 `d9936fd`. 저장소 CREDITS에는 없음 | 적힌 것 없음 | `_scratch/redraw-02-05-20261114/DELIVERY.md`(4번 줄, 「생성 원본과 프롬프트는 이 외장 SSD 작업 폴더에」), `_scratch/map-redraw-20261114/RELEASES.json`, `_shared/MAP-VILLAINS-HANDOFF-20261114.md`(신규 스프라이트 운영 배포 절) | 확인됨(사용자 확인) — 사용자 확인(2026-11-21 09:25 「전부 맞아」). 같은 날 밤 Codex 색인에 지도 악당·스프라이트 편집 기록이 있으나(2026-11-13T15:55~21:08Z, 과학34 루트 세션) 이 4개와 한 장씩 잇지는 못함 |
| L18 | `npc-dialogue/jihoon.webp`, `ipsae.webp`, `doto.webp` (대화 초상 3개) | 캐릭터 | 생성 원본이 `/Users/yel/.codex/generated_images/…`에서 나왔다(Codex 이미지 도구 경로). 한 장을 잘라 3명으로 나눔 | 2026-11-13, git 커밋 `eb13cb1`. 저장소 CREDITS에는 없음 | 적힌 것 없음 | `_scratch/npc-03-04-20261113/image-origin-cleanup.json`(생성 ID 3개), `_scratch/npc-03-04-20261113/portraits.zsh`, `_shared/OBSIDIAN-RULES-AUDIT-PROPOSAL-20261117.md` 199행(「4번 대화 초상 출처가 CREDITS에 없음」) | 확인됨(사용자 확인) — Codex 생성 경로·생성 ID 3개(위 근거) + 사용자 확인(2026-11-21 09:25 「전부 맞아」, 유료 요금제) |

### 아이콘·UI

| 번호 | 파일(묶음) | 종류 | 만든 곳 | 만든 날·기록 위치 | 이용 조건 | 근거 파일 경로 | 상태 |
|---|---|---|---|---|---|---|---|
| L19 | `expedition/timeWheel.webp`, `plantSensor.webp`, `seasonCompass.webp`, `storyCamera.webp` (탐험 도구 4개) | 아이콘·UI | OpenAI 내장 image_gen(`explorer-tools.png`에서 분리) | 2026-10-18, 생성 ID | L01과 같음 | `assets/expedition/generation.json`, `assets/expedition/manifest.json`, `assets/CREDITS.md`(0.5.0 절) | 확인됨 |
| L20 | `field/title-logo-v1.webp` (제목 로고) | 아이콘·UI | OpenAI 내장 image_gen | 2026-10-23, 프롬프트·출력 ID, 원본 `field/source/title-logo-v1-20261023.png` | L01과 같음 | `assets/field/title-logo-generation.json`, `assets/CREDITS.md`(2026-10-23) | 확인됨 |
| L21 | `field/paper-card-v1.webp`, `field/reward-rays-v1.webp`, `field/doto-map-v1.webp` (종이 카드·보상 광채·구역 입장 로딩, 3개) | 아이콘·UI | 힉스필드 `gpt_image_2_5` | 2026-10-25, 원본 `field/source/*-20261025.png`. 생성 ID·프롬프트 기록 없음 | 요금제·상업 이용 문구 없음 | `assets/CREDITS.md`(2026-10-25), `docs/HANDOFF-20261026.md` 24행 | 근거 약함 |
| L22 | `reward-cards/card-1~5-*.webp`, `thumb-1~5-*.webp` (성취 카드 10개) | 아이콘·UI | ChatGPT 앱의 Codex 내장 이미지 도구(GPT 이미지). 테두리·별·이름은 코드 | 2026-11-18. 생성 ID 기록은 없고 원본 PNG는 저장소에 넣지 않음 | L01과 같음 | `assets/CREDITS.md`(2026-11-18 성취 카드 절). 카드 코드 모듈은 `_shared/reward-cards/INTEGRATION.md` | 확인됨 |
| L23 | `field/app-icon.svg` (앱 아이콘) | 아이콘·UI | 파일 내용은 도형 2개짜리 직접 작성 SVG 코드. CREDITS의 「직접 작성 SVG」 표에는 홈·이전·소리·설정·활동 아이콘만 있고 앱 아이콘 이름은 없다 | git 커밋 `777e903`(2026-10-25) | 적힌 것 없음 | `assets/field/app-icon.svg`, `assets/CREDITS.md`(도구표 「직접 작성 SVG」 줄) | 근거 약함 |
| L24 | `og/life-clock-lab-20261027.jpg` (공유 미리보기 1200×600) | 아이콘·UI | 같은 커밋에 내장 image_gen 후보 PNG 5장과 생성 기록이 있다. 최종 JPG가 어느 후보에서 나왔는지는 적혀 있지 않다 | 2026-10-27, git 커밋 `cfe4ee3` | L01과 같음(후보 기준) | `docs/image-generation-og-samples-20261027.json`, `docs/image-generation-og-characters-20261027.json`, `docs/image-generation-og-redesign-20261027.json`, `docs/reviews/og-release-20261027.json` | 확인됨(사용자 확인) — 후보 5장 모두 내장 image_gen 기록, 최종 JPG도 사용자 확인(2026-11-21 09:25 「전부 맞아」)으로 Codex·GPT 이미지 |

### 영상

| 번호 | 파일(묶음) | 종류 | 만든 곳 | 만든 날·기록 위치 | 이용 조건 | 근거 파일 경로 | 상태 |
|---|---|---|---|---|---|---|---|
| L25 | `concepts/*.mp4`, `*.webm`, `*.webp` (개념 영상 5편 × 3, 15개) | 영상 | 자체 제작: 프로젝트 생물·도구 그림 + 직접 쓴 SVG 모션을 sharp·로컬 FFmpeg로 렌더, 자막은 영상에 구움 | 2026-10-22 첫 제작, 2026-10-24 care/seasons 다시 렌더, 2026-11-18 자막 굽기 | 들어간 그림은 L07 등의 조건을 따름. 도구 실행 파일은 배포하지 않음 | `assets/concepts/README.txt`, `scripts/render-concepts.mjs`, `docs/concept-captions-20261118/`, `_shared/caption-motion-20261118/`, `assets/CREDITS.md`(0.7.0) | 확인됨 |
| L26 | `video/intro.mp4`, `video/final.mp4`, `video/intro-poster.jpg`, `final-poster.jpg`, `final-still.jpg` (5개) | 영상 | 사용자가 제작해 제공한 마스터(1920×1080 HEVC)를 줄인 것. 이미지→영상 생성 도구 이름은 기록에 없다(제작 자료 README: 「생성 툴은 지정하지 않았다」) | 2026-10-27 제공, 원본 `_source/video/*-master-20261027.mp4`. 2026-11-13 소리 트랙 추가(L34), 2026-11-15 파이널 3.60–7.80초 장면 교체(L35) | 영상 그림 부분의 이용 조건 기록 없음 | `assets/CREDITS.md`(인트로·파이널 영상 절), `docs/video-production/20261027-character-storyboards/README.md` | 확인됨(사용자 확인) — 영상 그림 부분: 사용자 확인(2026-11-21 09:25 「전부 맞아」: 영상은 제미나이, 유료 요금제). 내레이션 소리는 L34로 따로 |

### 배경 음악

| 번호 | 파일(묶음) | 종류 | 만든 곳 | 만든 날·기록 위치 | 이용 조건 | 근거 파일 경로 | 상태 |
|---|---|---|---|---|---|---|---|
| L27 | `audio/music/main-theme.mp3`, `audio/music/ending-theme.mp3` | 배경 음악 | Suno, 사용자가 만들어 제공(원래 이름 `Main_The Garden Blooms.mp3`, `Final_Rising Motif.mp3`), 재인코딩 없음 | 2026-10-24 정리, 길이·해시 기록 | 사용자 확인으로만 「유료 요금제」(CREDITS 2026-10-24), 「Premier(유료)」(`_shared` 2026-11-18). CREDITS: 「계정을 직접 열람하거나 영수증을 검증한 기록은 아니다」 | `assets/audio/music/manifest.json`, `assets/CREDITS.md`(사용자 제공 메인·엔딩 테마), `_shared/voice-provenance-20261118.md` 요금제 표 | 근거 약함 |

### 효과음

| 번호 | 파일(묶음) | 종류 | 만든 곳 | 만든 날·기록 위치 | 이용 조건 | 근거 파일 경로 | 상태 |
|---|---|---|---|---|---|---|---|
| L28 | `audio/click.wav`, `select.wav`, `place.wav`, `inspect.wav`, `photo.wav`, `success.wav`, `reward.wav`, `error.wav`, `time.wav`, `step.wav` (10개) | 효과음 | Kenney Interface Sounds·Impact Sounds | 2026-10-22, 원본 이름·해시 | CC0 1.0, 고지 원문 함께 배포 | `assets/audio/manifest.json`, `assets/audio/KENNEY-INTERFACE-LICENSE.txt`, `assets/audio/KENNEY-IMPACT-LICENSE.txt` | 확인됨 |
| L29 | `audio/bell.wav` (Fupi 「Correct bell」), `audio/wind.wav` (BMacZero 「Clock Wind Sounds」) | 효과음 | OpenGameArt | 2026-10-29, 출처 URL·해시 | CC0-1.0 | `assets/audio/manifest.json`의 `additional`, `assets/CREDITS.md`(2026-11-17 절 끝) | 확인됨 |
| L30 | `audio/sfx/*.mp3` (지도 악당 7, 성취 카드 5, 구역 열림 2, 14개) | 효과음 | 과학34 공통 효과음 라이브러리(Kenney 1개, freesound 13개, 파일별 작성자 기록) | 2026-11-17·18·19, 2026-11-17 원본 페이지 다시 확인 | CC0 | `assets/CREDITS.md`(2026-11-17·18·19 표), `_shared/sfx-library-20261117/`(CREDITS.md·manifest.json) | 확인됨 |

### 목소리

| 번호 | 파일(묶음) | 종류 | 만든 곳 | 만든 날·기록 위치 | 이용 조건 | 근거 파일 경로 | 상태 |
|---|---|---|---|---|---|---|---|
| L31 | 115개: `audio/jihoon-*.mp3` 19(taemin), `audio/goblin-*.mp3` 25(Man Bo), `audio/doto-hints-el/*.mp3` 67·`audio/npc-dialogue/el-doto-*.mp3` 2·`audio/doto-memo-el/*.mp3` 2(Deok su) | 목소리 | ElevenLabs `eleven_v4`, 라이브러리 목소리(실제 사람 복제 없음) | 2026-11-18, 줄마다 voice ID·생성 ID·해시 | ElevenLabs Creator 유료 요금제, 상업 이용 가능. 2026-11-18 계정 조회로 확인 | `docs/VOICE-FILL-20261118.json`, `assets/audio/doto-hints-el/provenance.json`, `assets/CREDITS.md`(2026-11-18 절), `_shared/voice-provenance-20261118.md` | 확인됨 |
| L32 | `audio/npc-dialogue/jihoon-hello.mp3`, `jihoon-clue.mp3`(taemin), `ipsae-hello.mp3`, `ipsae-clue.mp3`(Bee) (4개) | 목소리 | ElevenLabs Voice Library `eleven_v4` | 2026-11-13, 줄마다 voice ID·생성 ID·해시 | 기록 파일에 요금제 문구 없음. `_shared`: 「사용자 확인: 음성을 만든 시점에는 전부 유료 요금제」, 2026-11-18 오후 계정 조회 `starter` | `assets/audio/npc-dialogue/provenance.json`, `_shared/voice-provenance-20261118.md`(4번 표, 빈칸 4) | 근거 약함 |
| L33 | `audio/npc-welcome.mp3` (도토 환영 인사. 문서상 2026-11-18부터 앱에서 안 씀) | 목소리 | 로컬 Qwen3-TTS-12Hz-1.7B-CustomVoice, 기본 합성 목소리 Sohee | 2026-11-09, 모델 리비전·시드·해시 | 모델 라이선스 Apache-2.0(출력물 권리 판단과는 별개라고 기록) | `docs/audio-provenance.json`, `docs/audio-generation-original.json`, `docs/AUDIO-PROVENANCE-20261109.md` | 확인됨 |
| L34 | `video/intro.mp4`, `video/final.mp4` 안의 내레이션 소리 트랙 | 목소리 | ElevenLabs(2026-11-19 사용자 확인). 목소리 이름·생성 ID는 저장소에 없음 | 2026-11-13 | 사용자 확인: 그때 Starter 유료 요금제, 상업 이용 가능 | `assets/CREDITS.md`(2026-11-19 절), `_shared/voice-provenance-20261118.md`(빈칸 1) | 근거 약함 |
| L35 | `video/final.mp4` 3.60–7.80초 교체 대사(앱은 이 구간 영상 소리를 끄고 L31의 `jihoon-film-seed-mix.mp3`를 틂) | 목소리 | Qwen3-TTS로 합성했다고만 적혀 있다. 모델 리비전·설정 기록 없음 | 2026-11-15 | Qwen3-TTS 모델은 Apache-2.0(L33 기록). 이 줄의 생성 기록은 없음 | `assets/CREDITS.md`(2026-11-15·2026-11-18 절) | 근거 약함 |

### 글꼴

| 번호 | 파일(묶음) | 종류 | 만든 곳 | 만든 날·기록 위치 | 이용 조건 | 근거 파일 경로 | 상태 |
|---|---|---|---|---|---|---|---|
| L36 | `fonts/NanumSquareNeoTTF-bRg.woff`, `-cBd.woff`, `-dEb.woff` (3개) | 글꼴 | 네이버 나눔스퀘어네오, 수정 없는 정적 WOFF | 2026-11-10, 받은 주소·해시 | SIL OFL 1.1, 원문 `fonts/NanumSquareNeo-OFL.txt` 함께 배포 | `assets/fonts/README.md`(NanumSquareNeo 절), `assets/fonts/NanumSquareNeo-OFL.txt`, `assets/CREDITS.md`(2026-11-10) | 확인됨 |

### 3D 모델

| 번호 | 파일(묶음) | 종류 | 만든 곳 | 만든 날·기록 위치 | 이용 조건 | 근거 파일 경로 | 상태 |
|---|---|---|---|---|---|---|---|
| L37 | `models/butterfly-egg.glb`, `butterfly-larva.glb`, `butterfly-pupa.glb`, `butterfly-adult.glb` (4개) | 3D 모델 | Meshy Image to 3D. 기본 이미지는 힉스필드 `gpt_image_2_5` 생성 또는 기존 그림을 자른 것(배포 안 함) | 2026-10-26, Meshy 원본 이름 기록. 기본 이미지 2026-10-25 | CREDITS: 「공개 배포 전에 Meshy 요금제의 상업·배포 이용 조건을 프로젝트 소유자가 확인해야 한다」. 요금제 기록 없음 | `assets/models/README.md`, `assets/models/source/generation.json`, `docs/3d/3D-MODEL-BRIEF.md`, `assets/CREDITS.md`(3D 모델) | 근거 약함 |

### 라이브러리(참고)

| 번호 | 파일(묶음) | 종류 | 만든 곳 | 만든 날·기록 위치 | 이용 조건 | 근거 파일 경로 | 상태 |
|---|---|---|---|---|---|---|---|
| L38 | `vendor/phaser-3.90.0.min.js` | 라이브러리 | Phaser 3.90.0 공식 배포 | 고정 버전, 2026-10-21 라이선스 대조 | MIT, `vendor/PHASER-LICENSE.md` 함께 배포 | `vendor/PHASER-LICENSE.md`, `assets/CREDITS.md`(도구표) | 확인됨 |
| L39 | `vendor/three-gltf-0.170.0.min.js` | 라이브러리 | three.js 0.170.0 + GLTFLoader | 고정 버전 | MIT, `vendor/THREE-LICENSE.md` 함께 배포 | `vendor/THREE-LICENSE.md`, `assets/models/README.md` | 확인됨 |

## 눈에 띈 점

- **CREDITS 문구와 생성 기록이 다르다.** `assets/CREDITS.md` 「2차 그림 주문 1~24번」은 「사용자가 … AI 이미지 생성 도구에서 만들어 넣은 그림」이라고 적었지만, `docs/image-generation-20261026.json`·`-sort-cards-`·`-tower-`에는 `generator: built-in image_gen`과 `.codex/generated_images/…/exec-*.png` 원본 경로가 그림마다 있다. 장부는 생성 기록을 따라 L06·L08~L10을 확인됨으로 적었다. CREDITS 문구는 고치지 않았다.
- **배포되지만 화면에서 쓰는 곳을 못 찾은 파일.** `game/bg8.webp`: `src/field-scenes.js:239`에서 4번 장은 `towerBackdrop()`을 쓰므로 `ROOM_BACKDROPS[4]`(bg8)에 닿지 않는다. `game/ending-forest.webp`: `src/game-assets.js` 밖에서 `endingForest` 참조를 못 찾았다(동적 키로 쓰일 가능성은 확인하지 못했다). `audio/npc-welcome.mp3`: 문서상 2026-11-18부터 앱에서 안 쓴다. 이 셋은 근거를 모으기보다 빌드에서 빼는 쪽이 간단하다. 뺄지는 사용자가 정한다.
- `fonts/NanumPenScript-OFL.txt`는 배포되지만 그 글꼴 파일은 배포되지 않는다(고지문만 남음).
- 3D 기본 이미지, 영상 마스터, `_source/` 원본 PNG처럼 배포에 안 들어가는 제작 자료는 장부에서 뺐다.
- L17·L18의 생성 기록은 `_scratch/` 작업 폴더에만 있다. 사용자 자료 없이도 CREDITS에 옮겨 적으면 근거가 저장소 안으로 들어온다(이번 작업 범위 밖이라 하지 않았다).

## 사용자가 줘야 하는 자료

| 줄 | 필요한 자료 | 오면 바뀌는 것 |
|---|---|---|
| L03 | (풀림, 2026-11-21) Codex 생성 기록과 변환 명령으로 이어져 확인됨. 더 줄 자료 없음 | — |
| L04 | 2026-09-23 「ChatGPT Image …」 원본 12장을 누가 만들었는지. 직접 만들었으면 그때 ChatGPT 계정 요금제 화면, 업체(아이스크림미디어 등)가 준 것이면 이용 근거가 되는 계약서나 메일 | 근거 약함 → 확인됨 |
| L05, L21 | 힉스필드 요금제·상업 이용 조건 화면(2026-10-25 생성 시점), 가능하면 생성 내역 화면(작업 ID) | 근거 약함 → 확인됨 |
| L37 | Meshy 요금제·상업 이용 조건 화면(2026-10-26 생성 시점). 기본 이미지 몫으로 위 힉스필드 화면도 함께 | 근거 약함 → 확인됨 |
| L27 | Suno 구독(Premier) 화면이나 결제 내역(2026-10-24 이전 생성 시점), 두 곡의 생성 내역 | 근거 약함 → 확인됨 |
| L32, L34 | ElevenLabs 2026-11-13 시점 결제 내역(그날 유료 요금제였다는 것), 영상 내레이션에 쓴 목소리 이름과 생성 내역(History 화면) | 근거 약함 → 확인됨 |
| L26 | 인트로·파이널 영상을 만든 이미지→영상 서비스 이름과 그 요금제·상업 이용 조건 화면(2026-10-27 이전) | 근거 약함 → 확인됨 |
| L17, L18 | 「Codex 내장 이미지 도구로 만들었다」는 확인 한 마디. 장부에는 이 확인과 `_scratch` 기록을 함께 옮긴다 | 근거 약함 → 확인됨 |
| L01·L02·L06~L16·L19·L20·L22, L24 후보 | ChatGPT 계정 요금제 화면(OpenAI 생성 그림 전체 공통). 지금도 확인됨이지만 `_shared/SCORE-110-PLAN-20261121.md` 127행이 요구하는 보강 자료다 | 보강 |
| L23 | 앱 아이콘 SVG를 직접(또는 에이전트가) 코드로 그렸는지 한 마디 | 근거 약함 → 확인됨 |

자료 없이 기록 보강으로 풀 수 있는 것(에이전트 일): L24는 후보 PNG 5장과 배포 JPG를 대조해 어느 후보인지 연결하면 된다. L35는 이 대사가 앱에서 음소거되는 구간이라, 생성 기록이 없으면 영상 파일에서 그 구간 소리를 L31 음성으로 바꿔 굽는 방법도 있다.


## 3-2a 보강 (2026-11-21)

`_shared/CODEX-IMAGE-RECORDS-20261121.md`의 색인(Codex 208건·Claude Code 68건)과 대조했다. 출처 미확인이던 L03 한 줄이 Codex 생성 기록으로 이어져 확인됨으로 바뀌었다(출처 미확인 1 → 0). 근거 약함 13줄은 대부분 2026-11-05 이전(이 맥의 생성 로그가 시작되기 전) 그림이나 요금제 화면이 필요한 줄이라 이번 대조로 바뀐 것이 없다. 10번 세션의 사용자 말(「이미지는 다 코덱스로 만들었어」, 「다 유료 요금제」)은 조율 세션이 이 프로젝트에 다시 확인받기 전이라 쓰지 않았다.

### 사용자 확인 반영 (2026-11-21 09:25 이후)

조율 세션에서 사용자가 「16곳 그림은 전부 Codex(GPT), 영상은 제미나이, 모두 유료 요금제」에 「전부 맞아」라고 답했다(`_shared/CODEX-IMAGE-RECORDS-20261121.md` 맨 위). 다른 도구 증거가 없는 그림·영상 5줄(L04·L17·L18·L24·L26)을 「확인됨(사용자 확인)」으로 바꿨다. 근거 약함 13 → 8줄.

그대로 둔 줄과 까닭:
- L05·L21(힉스필드 `gpt_image_2_5`, 그림 4개): 저장소 기록이 힉스필드를 가리켜 사용자 확인(Codex)과 어긋난다. 규칙대로 덮어쓰지 않고 보고한다. 힉스필드 요금제 화면이나 「이것도 Codex로 다시 만든 것」 같은 확인이 있으면 풀린다.
- L23(직접 작성 SVG 앱 아이콘): 생성 그림이 아니라 확인 범위 밖. CREDITS 「직접 작성 SVG」 표에 이름만 더하면 풀린다.
- L27(Suno 음악)·L32·L34·L35(목소리)·L37(Meshy 3D): 이번 확인의 범위(그림·영상) 밖.
