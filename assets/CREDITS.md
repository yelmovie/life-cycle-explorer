# 에셋 출처 · 저작권 기록

## 2026-10-24 · 마을 여행 인트로·아웃트로 새 버전

- 사용자 요청에 따라 정면 정적 구도를 마을 전경·골목 이동·연구소 입퇴장·다리 횡단·넓은 계곡으로 바꾼 초기 이미지 6장을 내장 OpenAI image_gen으로 새로 생성했다.
- `video-production/20261024-motion/`에 원본 PNG를 보관한다. 사용한 참조와 실제 생성 프롬프트는 `../docs/video-production/20261024-motion/image-prompts.json`, 생성 출력·치수·SHA-256은 같은 폴더 `asset-manifest.json`에 기록했다. 기존 지훈·잎새·도토와 마을 자산을 외형·세계관 참조로 사용했다.
- 영상 프롬프트 6개·장면 연결·자막·기존 음악 편집안은 같은 폴더 README/production.json/SRT에 있다. 실제 동영상은 생성하지 않았으며 이 PNG들은 게임 런타임에 연결하지 않은 제작 자료다. 이전 `20261024/` 버전은 보존했다.

## 2026-10-24 · 관찰 도구·생물·영상 제작 자료

- 관찰 돋보기·연구노트, 같은 품종의 개 3단계는 기존 중단 작업에서 내장 OpenAI image_gen으로 생성했다. `field/observation-notebook-generation.json`, `field/dog-life-generation.json`에 생성 기록을 보관한다. 원본은 `field/source/`, 실행 WebP는 알파를 유지한다.
- 온전한 잎 참고 모형·목질 줄기가 있는 장미는 `field/science-recovery-generation.json`의 프롬프트로 생성했다. 각각 `leaf-isolated-v1.webp`, `rose-shrub-v1.webp`이며 불투명 배경 및 잘못 연결된 배경 그림을 대신한다.
- 연구노트 글씨는 Nanum Pen Script, SIL OFL이다. 로컬 WOFF2와 `fonts/NanumPenScript-OFL.txt`를 배포한다.
- 인트로·파이널 기준 이미지 6장과 지훈 3패널은 이전 생성 결과를 복구했다. `../docs/video-production/20261024/asset-manifest.json`에 원본 해시와 대응 경로를 보관한다. 영상 생성 프롬프트·자막은 같은 폴더 README/SRT에 있다. 실제 인트로·파이널 동영상 파일은 생성하지 않았다.
- care/seasons 개념 영상은 같은 개체와 새잎·다음 세대 구분을 반영해 재렌더했다. 검증: `../docs/reviews/SCIENCE-RECOVERY-20261024.md`.

## 2026-10-24 · 사용자 제공 메인·엔딩 테마

- 사용자가 Suno로 제작해 제공한 `Main_The Garden Blooms.mp3`와 `Final_Rising Motif.mp3`를 각각 `audio/music/main-theme.mp3`, `audio/music/ending-theme.mp3`로 정리했다. 재인코딩하지 않았으며 이동 전후 SHA-256이 일치한다.
- 메인 곡은 67.88초, 엔딩 곡은 172.8초다. 두 곡 모두 스테레오 48kHz MP3이며 길이·원래 파일명·해시는 `audio/music/manifest.json`에 기록했다. 기존 Kenney 효과음의 CC0 고지와 별도로 관리한다.
- 2026-10-24 사용자 확인: 두 곡 모두 생성 당시 유료 요금제를 사용했다. 이 기록은 사용자의 확인에 근거하며, 계정을 직접 열람하거나 영수증을 검증한 기록은 아니다.

## 2026-10-23 · 시작 화면 제목 로고

- ‘생명 시계 연구실’ 두 줄 제목은 내장 OpenAI image_gen으로 생성했다. 원문 프롬프트와 출력 ID는 `field/title-logo-generation.json`, 투명 배경 PNG 원본은 `field/source/title-logo-v1-20261023.png`에 보존한다.
- 실행용 `field/title-logo-v1.webp`는 1200×668, 201,540 bytes다. 글자를 다시 그리거나 배경을 합성하지 않고 알파를 유지하며 크기와 형식을 최적화했다. 기존 지도·지훈·잎새·도토는 그대로 재사용한다.

## 2026-10-22 · 0.7.0 영상·소리·조력자

- 효과음 10개: [Kenney Interface Sounds](https://kenney.nl/assets/interface-sounds), [Impact Sounds](https://kenney.nl/assets/impact-sounds), CC0 1.0. 공식 다운로드의 고지 원문을 `audio/KENNEY-INTERFACE-LICENSE.txt`, `audio/KENNEY-IMPACT-LICENSE.txt`에 동봉한다. OGG를 mono 44.1kHz WAV로 변환하고 피크를 제한했다. `audio/manifest.json`에 원본 이름과 출력 해시를 기록한다. 외부 재생 요청 없이 로컬 제공하며, Kenney의 CC0 자료에는 프로젝트 자체 자료의 재배포 제한을 적용하지 않는다.
- 도토: 내장 OpenAI image_gen으로 새로 만든 투명 배경 다람쥐. `field/doto-generation.json`에 프롬프트·출력 ID·해시, `field/source/doto-20261022.png`에 원본을 보존한다. 실행용 WebP는 420×440, 알파 보존이다.
- 개념 영상 5편: 기존 프로젝트 생물·도구 그림과 자체 작성 SVG 모션을 sharp와 로컬 FFmpeg로 조합했다. 각 12초, 무음, H.264 MP4·VP9 WebM·포스터. 영상 내 한국어는 `field-concepts.js`의 DOM 자막과 범례다. `scripts/render-concepts.mjs`로 재제작할 수 있다. 도구 실행 파일과 원본은 배포하지 않는다.
- 이전 기록의 “영상·음원 파일 없음”은 당시 버전에 대한 설명이다. 현재 빌드에는 위 영상과 효과음이 포함된다.

## 도구·라이선스 검토 (2026-10-21)

| 도구·자료 | 쓰는 곳 | 라이선스·확인 근거 | 판정·조치 |
|---|---|---|---|
| Phaser 3.90.0 | 게임 엔진, 로컬 `vendor/` | MIT. 공식 v3.90.0 라이선스와 보관본 일치 | PASS. `vendor/PHASER-LICENSE.md`를 함께 배포 |
| Jua Regular 1.001 | 제목·본문용 로컬 웹폰트 2개 | SIL Open Font License 1.1. 폰트 내부 이름·버전·저작권 및 Google Fonts 원문 확인 | PASS. `fonts/Jua-OFL.txt`와 함께 배포. 바이너리 수정 없음 |
| 신규 관찰장 배경 | `field/observation-clearing.webp` | 내장 OpenAI image_gen, 2026-10-21, 생성 ID·원문 프롬프트 보관 | 생성 기록 확인. OpenAI 출력물 조건 확인, 인물·브랜드·외부 스톡 없음 |
| 기존 AI 그림 | `game/`, `expedition/`의 원본 대응 manifest | OpenAI 생성 기록과 최초 사용자 제공 ChatGPT 파일명·대응표 | 생성 출처 확인. 이전 계정·요금제 영수증은 저장소에 없으므로 이를 확인했다고 표시하지 않음 |
| 직접 작성 SVG | 홈·이전·소리·설정·활동 아이콘 | 프로젝트 자체 작성 | 외부 유료 아이콘·이모지 사용 없음 |
| npm 의존성·제한 도구 | 루트와 리뷰 보존본의 package.json 4개 | dependencies/devDependencies 없음. 배포 엔진은 위 Phaser | Remotion·유료 키트·NC/ND 자료·GPL 런타임 번들 발견 안 됨 |

확인한 1차 문서: [Phaser 3.90.0 MIT](https://github.com/phaserjs/phaser/blob/v3.90.0/LICENSE.md), [Google Fonts Jua OFL](https://github.com/google/fonts/blob/main/ofl/jua/OFL.txt), [OpenAI 이용약관의 Content 항목](https://openai.com/policies/row-terms-of-use/). 출력물의 권리 귀속과 입력 자료를 제공할 권한은 별개이며, 이 기록이 미확인 계약을 대신하지 않는다.

### 이번에 추가·재사용한 자료

- 관찰장: `field/source/observation-clearing-20261021.png` 원본 3,134,046 bytes → `field/observation-clearing.webp` 438,524 bytes, 1586×992. 기존 숲 지도와 같은 색·재질로 생성한 별도 장면이며 생물·문자·UI가 그려져 있지 않다. 생물 표본은 게임에서 합성한다. `field/prompt.txt`, `field/manifest.json`, `scripts/prepare-field-assets.py`로 대응한다.
- 지도·지훈의 관찰/돌봄/시간/이야기 4동작과 도구 4개는 기존 2026-10-18 생성물을 그대로 재사용한다. 투명 배경과 완전한 손·발·도구 범위를 육안 확인했다. 신규 캐릭터 생성 없음.
- Jua는 기존 `1udangtangtang` 프로젝트에서 같은 WOFF2를 복사했다. 한국어 368,172 bytes, 라틴 16,620 bytes. 출처·해시·내부 메타데이터는 `fonts/README.md`에 기록했다. 기존 보관 고지의 2017 표제는 공식·바이너리 표기에 맞춰 바로잡았고 OFL 본문을 보존했다.
- 전체 파일명·크기·화상 크기·SHA-256·정적 참조는 `asset-inventory-20261021.json`에 기록한다. 원본과 이전 그림은 삭제하지 않는다.

## 2026-10-18 이전 제작 이력

2026-10-18. 이 파일은 확인된 제작 이력과 라이선스를 기록한다. 제공 이미지의 권리자·공개 배포 허락 범위를 임의로 정하지 않는다.

| 자료 | 확인한 출처 | 현재 사용과 조건 |
|---|---|---|
| 최초 배경·타이틀·캐릭터 PNG | 사용자가 제공한 `ChatGPT Image 2026년 9월 23일…` 파일. 대응표는 `assets/README.md` | 원본 보존. 제공 주체와 권리자 이름·플랫폼 이용 조건은 별도 확정 필요 |
| 생물·도구·계절·지도 이미지 | `assets/generated/manifest.json`, `assets/adventure/manifest.json`에 OpenAI image_gen 제작 기록과 프롬프트 위치 있음 | 생성형 AI 이미지임을 앱 정보에 고지. 과학 내용은 모의 관찰용 도해 |
| 초기 Phaser 런타임 이미지 60개 | `assets/game/manifest.json`에 원본 경로, 출력 경로, 전후 크기, 용량 기록 | 기존 그림을 크기 조정한 WebP 사본. 당시 Phaser 전환에서 신규 이미지 생성 없음 |
| Phaser 3.90.0 | 공식 Phaser 배포의 고정 버전 | MIT. `vendor/PHASER-LICENSE.md`를 배포 빌드에 포함 |
| 당시 글꼴 | 운영체제 기본 Malgun Gothic / sans-serif | 2026-10-18에는 외부 폰트 파일 배포 없음. 현재 Jua는 위 검토표 참조 |
| 교육 내용 | 교육부 2022 개정 과학과 교육과정, moe.go.kr | [4과04-01]~[4과04-03]과 활동을 연결. 앱 문구는 요약이며 교과서 원문·삽화를 복제한 자료가 아님 |
| 학생 산출물 | 현재 브라우저에서 만든 그림·핀·조건·메모·선택 | 실제 수행 데이터로 이야기와 PNG를 구성. 외부 자동 전송 없음 |

영상·음원 파일은 현재 빌드에 없다. 도입/엔딩 영상은 별도 제작 캔버스에 요청안을 준비했다.

공개 배포 전에 프로젝트 소유자가 제작 주체·저작권자 표기·플랫폼 이용 조건을 확정해야 한다. 이 기록은 모든 제공 자료의 법적 권리를 확인했다는 의미가 아니다. 엔진 MIT 조건을 프로젝트 그림의 이용 조건과 혼합하지 않는다.

원본·이전 버전 에셋은 삭제하지 않았다. `app.js`, `adventure.js`, `inquiry-ui.js`와 이전 이미지 폴더는 보존 대상이다. 0.4.0 빌드는 `assets/game/` 사본만 포함했으며, 0.5.0의 추가 자산은 아래에 기록한다.

## 0.5.0에서 이어서 적용한 그림

`assets/expedition/source/forest-world.png`, `jihoon-actions.png`, `explorer-tools.png`는 중단된 2026-10-18 세션의 내장 OpenAI image_gen 생성 결과다. 생성 완료된 세 자료를 재사용했으며 새 생성 API/CLI는 호출하지 않았다. `assets/expedition/generation.json`에 당시 실제 프롬프트와 생성 ID를 기록했다. 지훈은 당시 프로젝트 캐릭터 기준의 얼굴·복장·비율을 따르도록 요청한 자료다.

숲 지도와 지훈의 관찰·돌봄·시간·이야기 동작, 시간 손잡이·관찰 센서·계절 나침반·이야기 카메라를 런타임에 연결했다. `manifest.json`과 `scripts/prepare-expedition-assets.py`가 원본/준비 사본을 대응한다. 도구는 생성 아틀라스의 칸 경계를 넘는 부분이 있어 연결된 알파 영역을 분리해 옆 도구의 조각을 제거했다. 이는 기존 생성 결과의 실행용 준비이며 새 그림 생성이 아니다. 원본의 투명도를 보존했다.

현재 배포 빌드는 `assets/game/`와 `assets/expedition/`에서 실제 참조되는 68개 이미지를 포함한다. `source/`, 원본 PNG, 프롬프트, QA 자료는 실행 패키지에서 제외한다. 이전 60개 사본의 원본 대응은 기존 `assets/game/manifest.json`에 그대로 남아 있다.
