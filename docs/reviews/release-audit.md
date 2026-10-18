# 배포 준비 점검 — Lane C

점검일: 2026-10-14 · 범위: 성능·자산·저장 안전·배포 문서

**진단 시점 판정: 배포 보류.** 손상된 저장 데이터의 중첩 필드를 복원한 뒤 오류가 나는 결함을 재현했다. 아래 초기 발견 표는 수정 전 기록이다. 이후 승인된 서버·빌드·메타 수정을 수행했으며 결과는 마지막 절에 구분했다. 최종 판정과 점수는 다른 lane의 저장 복원 수정과 통합 브라우저·배포 점검까지 합쳐 다시 결정해야 한다.

## 우선 수정할 항목

| 우선순위 | 결과·증거 | 위치 | 발견과 최소 수정안 |
|---|---|---|---|
| P1 | FAIL · 확인됨 | `core.js`의 `restore`(진단 최초 42행, 이후 46행) | `seed:null`, `navigationHistory:null`을 가진 version 1 JSON을 그대로 수용한다. 복원 후 `ready(state,2)` 또는 이동 이력 추가에서 `TypeError`를 재현했다. 저장값의 중첩 객체·배열·허용값을 검증하고 누락/손상 필드는 기본값으로 복구해야 한다. F4/F7 및 B10/B14 재검증 대상. |
| P1 | WARNING · 추정 | `app.js:9`, `app.js:39`, `app.js:40` | 저장 실패는 현재 DOM 문구에만 표시된다. 다음 렌더는 `이 기기에 저장됨`을 하드코딩하므로 실패 안내가 사라질 수 있다. 저장 성공 상태를 별도 변수로 유지하고 공통 상태 문구에 반영해야 한다. 실제 quota 오류 브라우저 재현은 미실시. |
| P1 | WARNING · 확인됨 | `server.mjs:7`, `server.mjs:12` | MIME 목록이 PNG/SVG만 지원한다. `.webp` 요청은 파일 확인 전에 403으로 끝난다. 새 그림을 WebP로 최적화할 때 `image/webp`를 추가해야 한다. |
| P2 | WARNING · 확인됨 | `server.mjs:5`, `server.mjs:11`–`server.mjs:14` | 정적 루트가 프로젝트 전체이고 MD를 제공하므로 `/README.md`, `/docs/TRD.md`가 200이다. 현재 loopback 개발 서버라 외부 공개가 확인된 것은 아니다. 운영용 배포는 필요한 파일만 별도 폴더로 패키징하거나 명시적인 경로 허용 목록을 사용해야 한다. |
| P2 | WARNING · 확인됨 | `package.json:6`, 프로젝트 루트 | production 패키징 명령·`.gitignore`가 없다. 루트 전체에는 원본 그림·과거 문서·작업 자료가 함께 있으므로 폴더 전체 업로드는 피해야 한다. `index.html`, 앱 모듈, CSS, 실제 사용하는 자산만 내보내는 build 명령과 배포 안내가 적합하다. |
| P2 | WARNING · 확인됨 | `assets/README.md` | 기존 12개 PNG의 제공 원본 파일명은 기록되어 있지만 생성/이용 조건 기록은 별도로 확인되지 않았다. 신규 생성 자산의 도구·날짜·가공·파일명도 추가해야 한다. 사용자 제공 이미지라는 사실만으로 독점권이나 제3자 권리 허락을 단정하면 안 된다. |
| P2 | WARNING · 확인됨 | `README.md`, `docs/TRD.md` | 현재 문서는 MVP, 원본 PNG, 약 28MB 기준이다. 이번 변경 후 실제 명령·용량·오프라인 범위·납품 파일·미지원 범위로 갱신해야 한다. URL/origin이 바뀌면 localStorage 기록을 공유하지 않는다는 안내가 없다. |
| P3 | WARNING · 확인됨 | `index.html:3` | 제목·favicon·theme-color는 있으나 description/OG 공유 메타가 없다. description은 바로 추가 가능하고, OG URL/이미지 절대 경로는 실제 배포 주소 확정 후 작성해야 한다. |

## 확인한 긍정적 근거

- `package.json`: 외부 런타임 의존성 0개. 별도 패키지 설치 없이 Node로 실행하도록 되어 있다.
- `core.js:1`, `core.js:21`: 프로젝트 전용 저장 키와 `version:1` 필드가 있다. 다른 origin의 저장소는 공유하지 않는다.
- `app.js:106`: 현재 브라우저 저장, 브라우저 데이터 삭제 시 소실, 서버로 학생 정보를 보내지 않음을 설정 안내에 표시한다.
- `app.js:109`–`app.js:110`: 초기화 전에 별도 확인 단계를 제공한다. 실제 버튼 동작 검증은 주 에이전트 범위다.
- `app.js`, `core.js`, `art.js`, `style.css`, `index.html`: 검토한 소스에서 외부 API 호출, 분석 SDK, 외부 폰트 로딩, 학생 이름/학번 필드를 발견하지 않았다. 자유 서술은 브라우저에 저장된다. 실제 브라우저 네트워크와 저장값은 별도 확인해야 한다.
- `server.mjs:12`: URL 인코딩한 상위 폴더 접근을 403으로 차단했다. `.mjs`도 제공하지 않았다.
- `server.mjs:14`: `X-Content-Type-Options: nosniff`를 제공한다. 개발 서버는 `127.0.0.1`에만 바인딩한다.
- `app.js:24`: 효과음 oscillator는 종료 후 연결을 해제한다. 다운로드 Object URL도 `app.js:118`에서 해제한다. 큰 지속 타이머나 외부 스트리밍은 발견하지 않았다.
- 이미지 배경은 현재 미션에 해당하는 경로를 선택하므로 뒤 미션 배경을 첫 화면에서 전부 로드하는 구현은 아니다. 실제 요청량은 브라우저 측정 필요.

## 실행한 검증

임시 포트 4198에서 기존 `server.mjs`를 실행하고 읽기 요청 후 프로세스를 종료했다. 코드·설정·에셋은 수정하지 않았다.

| 요청/검사 | 실제 결과 |
|---|---|
| `/` | 200, `text/html`, `Cache-Control: no-cache` |
| `/assets/title.png` | 200, `image/png`, `Cache-Control: no-cache` |
| `/README.md`, `/docs/TRD.md` | 200, `text/plain` |
| `/server.mjs` | 403 |
| `/missing.webp` | 403, 확장자 검사가 파일 존재 검사보다 먼저 적용됨 |
| `/%2e%2e%2fREADME.md` | 403 |
| version 1 저장값의 `seed:null` 복원 후 발아 완료 조건 검사 | `TypeError` |
| version 1 저장값의 `navigationHistory:null` 복원 후 이동 이력 추가 | `TypeError` |
| Git 상태/브랜치 조회 | Git 저장소가 아니어서 확인 불가 |

## 측정하지 못한 것과 최종 인수 조건

| 항목 | 상태 | 남은 확인 |
|---|---|---|
| 17 초기 로딩 | NOT TESTED | 주 에이전트가 최종 자산 통합 후 처음 방문/캐시 재방문의 실제 로딩 시간·전송량을 측정. 이미지 생성 중이라 초기 PNG 용량을 최종 수치로 사용하지 않음. |
| 18 자산 정리 | 부분 확인 | 최종 생성 자산·중복·미사용 후보·배포 폴더 크기를 주 에이전트가 재측정. 원본/참고 자료는 삭제하지 말고 배포 패키지에서 제외. |
| 19 교실 네트워크 내성 | NOT TESTED | 오프라인 설치/캐시는 현재 README에서 범위 밖이다. 최종 브라우저로 연결 차단 후 이미 연 화면·새 미션·새로고침을 분리해 확인하고 보장 범위를 문서화. |
| 20 데이터 안전 | FAIL · 확인됨 | 위 손상 데이터 복원을 수정하고 정상/구버전/잘못된 JSON/부분 손상 저장값, 저장 실패 안내를 재검증. 네트워크 외부 전송과 실제 localStorage 내용도 브라우저에서 확인. |
| 21 저작권·문서·배포 | WARNING / NOT TESTED | 신규 자산 출처, 납품 명령, 배포 파일 목록, 저장 origin 안내 갱신. 외부 배포 URL이 없으므로 HTTPS·하위 경로·공유 이미지·학생 접근·배포 smoke test는 미실시. |

실제 배포 주소에서 시작 → 첫 미션 → 저장 → 새로고침 복원 smoke test를 배포 담당자가 수행해야 한다. 로컬 성공을 배포 성공으로 간주하지 않았다. 17~21의 확정 점수와 전체 verdict는 최종 통합 검증 전에는 산출하지 않는다.

## 승인된 배포 준비 수정

- `server.mjs`: 런타임 파일과 지원 이미지/폰트 자산만 제공. README·docs·소스 원본·raw-png·숨김 경로는 제공하지 않는다. 경로 제외 검사는 대소문자를 무시해 Windows에서도 원본 경로 우회를 막는다.
- `server.mjs`: WebP MIME, GET/HEAD만 허용, ETag 조건부 요청(304), `nosniff`, Referrer-Policy, 자체 리소스 중심 CSP를 추가했다. 개발 모드는 매번 재검증하고 `--dist` 미리보기의 그림만 1시간 캐시한다. 임베드 가능한 교육 콘텐츠이므로 별도의 frame-ancestors 차단은 추가하지 않았다.
- `scripts/build.mjs`: Node 표준 API만으로 런타임과 실제 참조 그림을 `dist/`에 복사한다. 자산 템플릿 경로도 제한된 파일 패턴으로 추적하고 실제 대소문자·파일 존재를 확인한다. JS/CSS 연결과 JS 모듈 의존성도 패키징 목록과 대조한다. `assets.js`와 `polish.css`를 포함한다.
- 빌드는 `assets/generated/source`, `raw-png`, 원본 폴더를 제외한다. 파일 삭제를 하지 않으며, 기존 dist에 새 배포 목록 밖 파일이나 링크가 있으면 빌드를 중단한다. 같은 배포 목록은 복사 덮어쓰기로 반복 빌드 가능하다. `build-manifest.json`에 상대 파일 목록·바이트 크기·총량을 기록한다.
- `package.json`: 기존 start/test 보존, check에 신규 JS 문법 검사 추가, `build`와 `preview` 명령 추가.
- `index.html`: 한국어 description과 `polish.css` 연결을 추가하고 head/body를 읽기 쉽게 정리했다. 아직 없는 배포 URL을 OG URL로 만들지는 않았다.

### 수정 후 확인한 결과

임시 4198 서버를 새 코드로 실행하고 테스트 종료 후 중지했다.

| 검사 | 결과 |
|---|---|
| 서버·빌드·assets 모듈 `node --check` | PASS |
| `/`, `/assets/optimized/title.webp` | 200, HTML/WebP MIME 정확 |
| `/README.md`, `/docs/TRD.md`, `/server.mjs` | 404 |
| `/assets/generated/source/test.png`, `/assets/raw-png/test.png` | 404 |
| `/%2e%2e%2fREADME.md` | 403 |
| HEAD | 200, 본문 0바이트 |
| 동일 ETag 조건부 GET | 304 |
| POST | 405, `Allow: GET, HEAD` |
| 응답 보안 헤더 | `nosniff`와 CSP 확인 |
| 빌드 누락 검출 | 생성 전 `m04-vessel.webp`, 연결 전 `polish.css`를 누락으로 검출해 복사 시작 전에 중단 |

이미지 생성과 UI 통합이 진행 중이라 실제 최종 `npm run build` 및 dist 미리보기 확인은 자산 완료 후 수행한다.

다른 lane의 최신 저장 복원 수정을 다시 읽어 `seed:null`, `analysis:null`(A/B 결과가 다른 실험), `navigationHistory:null`으로 동일 검사를 반복했고 모두 오류 없이 끝났다. 초기 F4/F7의 구조 손상 `TypeError`는 해소됨을 확인했다. `app.js`의 저장 상태도 `storageHealthy`/`saveLabel()`로 렌더 간 유지하도록 바뀌었다. 실제 브라우저 quota 오류 안내와 정상 새로고침 복원은 통합 UI 검증 결과를 따른다.
