# AGENTS.md — 생명 시계 연구실 (life-clock-lab)

이 파일은 이 저장소에서 일하는 사람·에이전트(Codex, Claude Code 등)가 공통으로 따르는 프로젝트 지침이다. `CLAUDE.md`는 이 파일을 불러오기만 한다. 2026-10-30 Windows PC에서 저장소를 읽고 작성했다. Mac에서는 아직 아무 명령도 실행해 보지 않았다.

이 저장소는 외장 SSD에 있고 집의 Mac mini와 직장의 Windows PC를 오가며 개발한다. 상위 폴더 `iscreammedia_sc34`는 16개 프로젝트를 묶은 폴더이므로, 이 지침은 `4 lifecycle` 폴더에만 적용한다. 상위 폴더의 `AGENTS.md`·`CLAUDE.md`(graphify 규칙)는 별도 파일이며 여기서 바꾸지 않는다.

## A. 프로젝트 개요

초등 3학년 과학 「생물의 한살이」(2022 개정 [4과04-01~03])를 다루는 태블릿용 탐구 게임이다. 다섯 구역(나비의 숲·씨앗 연구소·햇살 온실·사계절 정원·생명 시계탑)을 돌며 관찰·조건 실험·돌봄·계절 비교·증거 이야기를 남긴다. 자세한 내용은 `README.md`, 폴더 안내는 `docs/PROJECT-STRUCTURE.md`(본문 속 `D:/` 경로는 당시 드라이브 문자로, 지금 위치와 다를 수 있다).

실제 기술 스택:

- 바닐라 JavaScript ES 모듈 + CSS. 빌드 도구(Vite·번들러)·TypeScript·프레임워크는 쓰지 않는다.
- Phaser 3.90.0, three-gltf 0.170.0은 `vendor/`에 파일로 들어 있다. CDN·npm 설치 없이 동작한다.
- `server.mjs`는 Node 내장 모듈만 쓰는 정적 서버다. `127.0.0.1`에만 바인딩한다.
- 배포는 Cloudflare Pages 직접 업로드(`wrangler.jsonc`, 출력 폴더 `dist`).
- Python은 에셋 변환 스크립트 4개(`scripts/*.py`, Pillow 사용)에만 쓰고, 실행·테스트·빌드에는 필요 없다.

주요 폴더:

| 위치 | 성격 | 내용 |
|---|---|---|
| `src/` | 원본 | 실행 JS·CSS 전부(단, 아래 생성 파일 2개 제외) |
| `index.html`, `server.mjs`, `manifest.webmanifest`, `offline-config.json` | 원본 | 진입·서버·PWA 설정 |
| `content/field-missions.json` | 원본 | 구역·추가 발견 미션 문구의 원본 |
| `assets/` | 원본 | 그림·소리·영상·글꼴·3D 모델. `assets/field/source/`, `assets/generated/` 등 원본 그림 포함 |
| `vendor/` | 원본(외부 라이브러리) | Phaser·three-gltf와 라이선스 |
| `scripts/` | 원본 | 빌드·검사·QA·에셋 변환 스크립트 |
| `tests/` | 원본 | `node --test` 회귀 검사 |
| `docs/` | 원본 | 기획·검증 기록·인계 문서 |
| `archive/legacy-ui/`, `archive/maintenance/`, `_unused/` | 원본(보관) | 예전 UI·스크립트·미사용 에셋. git 추적 중 |

사용자 작성 원본과 자동 생성 파일 구분:

| 파일·폴더 | 만드는 방법 | 직접 수정 |
|---|---|---|
| `src/game-info.js` | `scripts/sync-info.mjs`가 `package.json` 버전으로 생성 | 금지. 버전은 `package.json`에서 바꾼다 |
| `src/field-mission-data.js` | `scripts/sync-info.mjs`가 `content/field-missions.json`으로 생성 | 금지. JSON을 고친다 |
| `dist/` | `npm run build` | 금지. 다시 빌드한다 |
| `archive/builds/` | `npm run build`가 바뀐 이전 `dist`를 옮겨 보관 | 금지 |
| `.tmp/` | QA 스크립트 산출물(스크린샷·JSON·격리 브라우저 프로필) | 필요 시 재생성 |
| `graphify-out/` | graphify 도구 | 재생성 |
| `.wrangler/` | Wrangler 로컬 캐시 | 재생성 |

`npm start`·`npm test`·`npm run check`·`npm run build`는 모두 먼저 `sync-info.mjs`를 실행하므로 생성 파일 두 개가 다시 쓰인다. 이 두 파일은 git에 추적되므로 실행 후 diff가 생길 수 있다(내용이 같으면 생기지 않는다).

## B. 실행 환경

| 항목 | 저장소에서 확인한 내용 |
|---|---|
| Node.js | `README.md`에 "Node.js 20 이상"이라고만 적혀 있다. `package.json`의 `engines`, `.nvmrc`, `.node-version`, `.tool-versions`는 없다. 정확한 버전은 **미지정**이며 임의로 고정하지 않는다 |
| 패키지 관리자 | npm 스크립트만 쓴다. `dependencies`·`devDependencies`가 없어 `npm install`이 필요 없다 |
| lockfile | **없다**(`package-lock.json`·`pnpm-lock.yaml`·`yarn.lock` 모두 없음). 의존성이 없으므로 새로 만들 필요도 없다 |
| `node_modules/` | 없다. 생기면 `.gitignore` 대상이다 |
| Python | 버전 **미지정**, `requirements.txt`·`pyproject.toml` 없음. 에셋 변환 스크립트에 Pillow가 필요하다는 것만 import로 확인했다 |
| 선택 도구 | Playwright(QA), sharp·FFmpeg(`concepts:render`), Wrangler 4(배포). 저장소에 설치돼 있지 않고 버전도 고정돼 있지 않다 |

의존성을 새로 추가할 일이 생기면 먼저 사용자에게 묻는다. 추가하게 되면 npm을 쓰고 생성된 `package-lock.json`을 함께 커밋하는 것을 제안한다(현재는 없음).

## C. 명령어

저장소 루트(`4 lifecycle`)에서 실행한다. npm 스크립트는 Mac·Windows에서 같다.

| 목적 | 명령 | 비고 |
|---|---|---|
| 개발 서버 | `npm start` | http://127.0.0.1:4186 |
| 테스트 | `npm test` | `node --test tests/*.test.js` |
| 문법 검사 | `npm run check` | 활성 런타임·빌드 파일에 `node --check` |
| 빌드 | `npm run build` | `dist/` 생성. 바뀐 이전 `dist`는 `archive/builds/`로 이동 |
| 빌드 결과 미리보기 | `npm run preview` | `dist`만 제공(기본 포트도 4186. 다른 포트는 아래 참고) |
| 교실 QA | `npm run check:classroom` | Playwright 필요. 먼저 `node scripts/qa-field-play.mjs` 실행 |
| 개념 영상 렌더 | `npm run concepts:render` | sharp·FFmpeg 필요 |

없는 것: **린트, 타입 검사, 포맷터 스크립트는 없다.** 문법 검사는 `npm run check`가 대신한다.

포트를 바꿔 실행할 때만 OS별로 다르다.

```powershell
# Windows PowerShell
$env:PORT='4202'; npm start
$env:PORT='4207'; npm run preview
```

```sh
# Mac (zsh/bash)
PORT=4202 npm start
PORT=4207 npm run preview
```

`.claude/launch.json`에는 `life-clock-lab`(4186), `life-clock-lab-alt`(4191), `life-clock-dist`(4207) 구성이 있다.

설치·배포 명령:

- 설치: 필요한 패키지가 없어서 설치 명령이 없다.
- 배포: `npm run build` 후 `wrangler pages deploy dist --project-name life-clock-lab --branch main`. Wrangler 4와 Cloudflare 계정 연결이 필요하다. GitHub 푸시로 자동 배포되지 않는다. **운영 배포는 자동 승인이다.** 코드 변경이 `npm run check`·`npm test`·빌드·동작 확인을 통과하면 묻지 않고 바로 배포하고, 운영 주소에서 바뀐 파일을 확인한다(2026-11-16 사용자 지시).

## D. 두 OS를 오갈 때의 규칙

공유해도 되는 것: 소스(`src/`, `index.html`, `server.mjs`), `content/`, `assets/`, `vendor/`, `scripts/`, `tests/`, `docs/`, 설정 파일(`package.json`, `wrangler.jsonc`, `.gitattributes`, `.gitignore`, `.claude/launch.json`).

다른 OS에서 만든 것을 재사용하지 않는 것: `node_modules/`(지금은 없음), Python 가상환경(`.venv` 등, 지금은 없음), `.wrangler/`, QA용 브라우저 프로필이 든 `.tmp/`, 각 PC에 따로 설치한 Playwright·sharp·FFmpeg.

재생성할 수 있는 폴더(지워도 명령으로 다시 만들 수 있음. 그래도 지우기 전에 사용자에게 확인):

- `dist/` → `npm run build`
- `src/game-info.js`, `src/field-mission-data.js` → `npm run check` 등 아무 npm 스크립트
- `.tmp/` → QA 스크립트 재실행(약 2.8GB. 과거 검증 스크린샷은 다시 안 만들어지므로 근거 자료가 필요하면 남긴다)
- `graphify-out/` → `graphify update .`
- `.wrangler/` → 다음 Wrangler 실행 시

절대 삭제하면 안 되는 폴더·파일:

- `src/`, `content/`, `assets/`(특히 `assets/field/source/`, `assets/generated/`, `assets/models/`), `vendor/`, `scripts/`, `tests/`, `docs/`, `index.html`, `server.mjs`, `package.json`
- `_source/`(AI 그림 원본 내보내기, gitignore 대상이라 **git에 백업이 없다**)
- `assets/models/raw/`(Meshy 3D 원본 약 68MB, gitignore 대상이라 **git에 백업이 없다**)
- `assets/raw-png/`, `reference/`(gitignore 대상 원본·참고 자료, git에 백업이 없다)
- `archive/builds/`(gitignore 대상인 이전 배포본, 다시 만들 수 없다)
- `archive/legacy-ui/`, `archive/maintenance/`, `_unused/`(예전 저장 자료 호환·기록용 보관물)
- `HANDOFF.md`(gitignore 대상 로컬 인계문)

설치·실행 오류가 나도 소스·원본 에셋·설정을 지우거나 되돌리지 않는다. 나중에 lockfile이 생기더라도 오류 해결을 위해 지우지 않는다. 원인을 먼저 보고한다.

경로·플랫폼 주의점(2026-10-30 확인):

- 애플리케이션 코드(`src/`, `server.mjs`, `index.html`)에는 절대경로 하드코딩이 없다.
- `src/`·`scripts/`·`tests/`의 상대 import와 `index.html`·`src/`의 `assets/...` 참조는 실제 파일명과 대소문자가 모두 일치했다. Mac(대소문자 무시가 기본인 APFS)과 Windows는 대소문자가 틀려도 동작하지만 Cloudflare 배포·Linux에서는 깨지므로, 새 파일을 만들 때 import와 파일명을 정확히 맞춘다.
- `.ps1`·`.bat`·`.cmd` 스크립트는 없고, npm 스크립트는 OS 공통이다.
- **QA·제작 스크립트에 다른 PC 경로가 하드코딩돼 있다.** `scripts/qa-*.mjs` 대부분이 Playwright를 `C:/Users/bongb/.cache/codex-runtimes/...`에서 불러오고, 여러 스크립트가 `TEMP`/`TMP`를 `D:/DevTemp`로 강제한다. 이 PC에서도, Mac에서도 그대로는 안 맞는다.
  - `PLAYWRIGHT_MODULE` 환경변수를 받는 스크립트: `qa-classroom-media`, `qa-design-audit`, `qa-field-regression`, `qa-field-touch`, `qa-observation-views`, `qa-popup-survey`, `qa-recovery-layout`, `qa-recovery-play`, `qa-recovery-storage`, `qa-responsive-20261025`.
  - 환경변수를 받지 않는 스크립트(경로가 고정): `qa-field-play`, `qa-final-*`, `qa-map-viewport`, `qa-ui-acceptance`, `qa-request-fixes-20261025`, `qa-delivery-20261028`. `check:classroom`이 먼저 요구하는 `qa-field-play`도 여기에 속한다.
  - `scripts/render-concepts.mjs`는 `SHARP_MODULE`(기본값 위 Codex 경로)과 `FFMPEG`(기본값 `D:/tools/ffmpeg/ffmpeg.exe`)를 쓴다. Mac에서는 두 환경변수를 반드시 지정해야 한다.
  - 이 스크립트들을 고치는 것은 별도 작업이다. 지금은 실행 전에 스크립트를 임시 폴더에 복사해 경로를 바꾸거나 환경변수를 지정해서 쓴다. 게임의 CSP(`script-src 'self'`) 때문에 Playwright `waitForFunction`이 막히면 QA 쪽 컨텍스트에서 `bypassCSP`를 쓰고, 게임의 CSP는 완화하지 않는다.
- exFAT 외장 SSD는 소유권을 기록하지 않아 git이 `dubious ownership`으로 멈춘다. 전역 git 설정을 바꾸지 말고 명령마다 `git -c safe.directory='*' status`처럼 실행한다. 전역 `safe.directory` 추가는 사용자가 직접 결정한다.
- exFAT에서는 심볼릭 링크를 만들지 않는다. `scripts/build.mjs`도 링크된 `dist`를 거부한다.
- Mac이 SSD에 `._*` 파일(AppleDouble)을 남길 수 있다. 상위 폴더에 이미 `._graphify-out`이 있다. `.gitignore`에 `._*`가 없으므로 `git status`에 보이면 커밋하지 않는다(무시 규칙 추가는 제안만 한다).
- 폴더명에 공백이 있다(`4 lifecycle`). 셸에서는 경로를 따옴표로 감싼다.

줄바꿈 정책: `.gitattributes`가 있다. `* text=auto`이며 `js·mjs·json·css·html·md`는 `eol=lf`, `png·webp·jpg`는 binary다. 이 정책을 그대로 따른다. 전체 파일 줄바꿈 변환이나 전역 `core.autocrlf` 변경은 하지 않는다. 현재 Windows PC는 `core.autocrlf=true`다. `.editorconfig`는 없다. 필요하면 `.gitattributes`와 같은 LF·UTF-8 규칙으로 만드는 것을 사용자에게 제안만 한다.

## E. 환경변수·저장 데이터

필요한 비밀값은 없다. `.env`는 `.gitignore` 대상이며 현재 없다. 있더라도 내용을 출력하거나 덮어쓰지 않는다.

코드가 읽는 환경변수(이름만 기록):

- 서버: `PORT`
- QA: `BASE_URL`, `PLAYWRIGHT_MODULE`, `QA_OUTPUT`, `TEMP`, `TMP`, `START_CHAPTER`, `CASES`, `LAYOUT_ONLY`, `WRITING_LENGTHS`, `AUDIT_LABEL`, `AUDIT_SCREENS`, `AUDIT_VIEWS`, `FIX_CASES`, `FIX_LABEL`, `RELEASE_FIXTURE`, `RELEASE_OUTPUT`, `RESPONSIVE_FIXTURE`, `RESPONSIVE_LABEL`, `RESPONSIVE_SCREENS`, `RESPONSIVE_VIEWS`, `RESPONSIVE_WORKERS`
- 영상 렌더: `SHARP_MODULE`, `FFMPEG`
- 배포: Wrangler 자체 로그인 정보를 쓴다. 저장소에는 토큰이 없고, 넣지 않는다.

학생 데이터:

- 학생 기록은 브라우저 `localStorage`의 `life-clock-lab.phaser.4`에만 저장된다. 서버 전송·계정·학생 명단 수집은 없다.
- 포트·도메인·브라우저가 바뀌면 저장 공간이 달라진다. 개발 서버(4186)와 dist 미리보기·운영 주소의 기록은 서로 보이지 않는다. 이것은 정상이다.
- 오프라인 자료(`CacheStorage`)는 학생 기록과 별개이며 `dist`에서만 켜진다(개발용 `offline-config.json`은 `{"enabled":false}`).
- 실제 학생·운영 브라우저의 기록을 테스트용으로 초기화하거나 지우지 않는다. QA는 `.tmp/` 아래 격리된 브라우저 프로필에서 한다. 교사 시연은 학생 상태의 임시 복사본을 쓰므로 학생 기록 대신 이것을 활용한다.
- 저장 형식(`game-model.js`, `field-model.js`의 복원 함수)을 바꿀 때는 예전 저장 자료가 그대로 복원되는지 테스트로 확인한다.

## F. 검증과 작업 종료

수정 후 검증 순서(실제 저장소 명령):

1. `npm run check`
2. `npm test`
3. 화면에 보이는 변경이면 `npm start`로 띄워 브라우저에서 확인한다.
4. 배포본이 바뀌는 변경이면 `npm run build` 후 `npm run preview`(다른 포트)로 확인한다.
5. 필요하면 Playwright QA 스크립트를 쓴다(D절의 경로 주의 참고).

`docs/`, `README.md`, 이 파일만 바꾼 경우에는 위 검사가 필요 없다.

보고 원칙:

- 이번 OS에서 실제로 실행한 것만 "통과"라고 쓴다. Windows에서 통과한 결과를 Mac에서도 통과했다고 쓰지 않고, 그 반대도 마찬가지다. 보고에 OS와 Node 버전(`node -v`)을 함께 적는다.
- 브라우저 창 크기·에뮬레이션 검사(예: 1180×757, 1024×768, 1280×800)와 실제 태블릿·전자칠판에서의 터치·드래그·회전·가상 키보드·소리 검사는 구분해 적는다. 실기기에서 하지 않았으면 "실기기 미검증"이라고 쓴다.
- PNG·인쇄는 "파일 생성 확인"과 "파일을 열어 내용·한글·잘림 확인", "실제 종이 출력"을 구분한다.

SSD를 분리하기 전에:

- 실행 중인 개발 서버(`npm start`, `npm run preview`, `.claude/launch.json` 구성)와 백그라운드 QA·빌드·`concepts:render`·파일 감시·에이전트 작업이 남아 있지 않은지 확인하고 종료한다.
- `git -c safe.directory='*' status`로 미커밋 변경을 확인하고, 커밋할지는 사용자에게 맡긴다.
- 운영체제의 안전 제거(Windows: 하드웨어 안전 제거, Mac: Finder 꺼내기)를 한 뒤 뽑는다.

다음 컴퓨터에서 이어갈 때 최소 작업:

1. 셸·OS·`node -v`를 확인한다(Node 20 이상).
2. 저장소 루트로 이동해 `git -c safe.directory='*' status`, `git -c safe.directory='*' log -1`로 상태를 확인한다.
3. `npm run check`, `npm test`를 실행한다(설치 단계 없음).
4. `npm start` 후 http://127.0.0.1:4186 을 연다. 이 컴퓨터의 브라우저에는 다른 컴퓨터의 학생 기록이 없다(정상).
5. QA·영상 렌더가 필요하면 그 컴퓨터에 맞는 `PLAYWRIGHT_MODULE`·`SHARP_MODULE`·`FFMPEG` 경로를 준비한다.
6. 최근 인계는 `docs/HANDOFF-20261026.md`(git 추적)와 로컬 `HANDOFF.md`(git 미추적, 있을 때만)를 본다.

## 작업 범위 원칙

- 요청받지 않은 초기화·삭제를 하지 않는다. 검증을 통과한 요청 작업의 커밋·푸시·운영 배포는 묻지 않고 한다(자동 승인).
- 사용자의 미커밋·미추적 변경을 보존한다. 다른 세션이 같은 폴더에서 작업 중일 수 있으니 브랜치 전환·stash·reset을 하지 않는다.
- 학습 판정·저장 키·보상 구조는 사용자 요청 없이 바꾸지 않는다.
- 코드 변경 후에는 상위 규칙대로 `graphify update .`로 그래프를 갱신한다(graphify가 설치된 PC에서만).
