# 프로젝트 파일 위치

프로젝트 루트는 `D:/iscreammedia_sc34/4 lifecycle`다. 2026-10-24 정리에서 파일 35개·폴더 묶음을 이동했다. 파일은 삭제하지 않았고, 이동 전후 크기·개수와 개별 파일 해시를 확인했다. 원래 위치와 새 위치는 [이동 기록](organization-20261024.json)에 있다.

| 위치 | 용도 |
|---|---|
| `index.html`, `game-*.js`, `field-*.js`, `game.css` | 현재 게임 화면·로직·입력·저장·소리 |
| `expedition.js`, `adventure-core.js`, `adventure-export.js`, `inquiry-core.js`, `core.js` | 이전 기록 호환·출력·회귀 검사에 쓰는 모듈 |
| `assets/audio/music/main-theme.mp3` | 메인·탐험 테마, 반복 재생 |
| `assets/audio/music/ending-theme.mp3` | 엔딩·기록증 테마, 한 번 재생 |
| `assets/audio/music/manifest.json` | 음악 원래 이름·길이·경로·해시 |
| `assets/audio/*.wav` | 효과음과 출처 고지 |
| `assets/field/`, `assets/game/`, `assets/expedition/` | 게임 그림과 원본 대응 기록 |
| `assets/concepts/`, `assets/fonts/` | 개념 영상·포스터·웹폰트 |
| `docs/planning/original/` | 루트에 있던 초기 PRD·TRD·QA·기획안 |
| `docs/reviews/` | 화면·기능·에셋 검증 결과 |
| `reference/design-package/` | 기존 `files/`의 최초 디자인 패키지 |
| `reference/source-images/` | 기존 `image/`의 제공 원화 |
| `reference/sample-pages/` | 기존 `samplepages/`의 참고 화면 |
| `archive/legacy-ui/` | 이전 app/adventure/inquiry/Phaser UI 소스 |
| `archive/maintenance/` | 이전 버전의 일회성 수정·검증 스크립트 |
| `archive/unused-assets/` | 기존 `_unused/`의 보관 자료 |
| `archive/builds/` | 이전 배포본. 다음 빌드의 보관 위치도 여기로 통일 |
| `scripts/`, `tests/`, `vendor/` | 현재 제작·검사 명령, 회귀 검사, Phaser |
| `dist/` | `npm run build`로 만든 배포본 |
| `.tmp/` | 재생·화면 검증용 임시 파일 |

`npm start`, `npm test`, `npm run check`, `npm run build`는 루트에서 실행한다. 과거 문서의 옛 경로는 이동 기록을 참고한다. 참고 원본·이전 빌드·작업용 원본은 현재 배포에 포함하지 않는다.
