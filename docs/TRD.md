# TRD — 생명 시계 연구실 MVP

버전 0.1 · 2026-09-23 · 초기 구현의 역사 자료

> 2026-10-18 현재 기술 구성은 [Phaser 0.4.0 구현 기록](PHASER-IMPLEMENTATION-20261018.md)과 루트 README를 따른다. 아래의 프레임워크·진입점·파일 표는 이전 MVP 기록이다.

## 구조

별도 설치 패키지가 없는 JavaScript ES Modules + HTML/CSS 정적 웹앱. 제공된 2D 배경을 그대로 활용한다. 3D 엔진이나 프레임워크는 넣지 않는다.

| 파일 | 책임 |
|---|---|
| index.html | 한국어 문서, viewport, 앱/알림/dialog 영역 |
| app.js | 화면 렌더, 이벤트, 안내, localStorage, PNG 출력 |
| core.js | 초기 상태, 학습 데이터, 진행/완료 판정, 모형 계산 |
| art.js | SVG 학습 도해, 640×360 픽셀 자연 맵 Canvas |
| style.css | 색/간격/조작 크기, 가로형 레이아웃과 반응형 |
| server.mjs | 개발용 Node HTTP 서버, 기본 127.0.0.1:4186 |
| tests/core.test.js | 진행 잠금, 조건 통제, 데이터 보존, 각 활동 완료 조건 |

## 화면과 입력

`screen = home | map | 0..9`. 이동 함수가 진입 가능 여부를 확인한다. 진행은 `completed`에 중복 없이 저장한다. 2D 화면은 `workspace + notebook-panel + mission-footer` 구조다. 지도는 저해상도 Canvas를 정수 좌표로 그리고 CSS `image-rendering: pixelated`로 확대한다. 구역 선택은 접근성 있는 DOM 버튼이다. 모든 주요 게임 UI는 배경 이미지와 독립적이다.

표본 확대는 CSS transform, 이동 렌즈는 별도 SVG 확대창이다. Pointer Events로 두 손가락 사이 거리 변화를 계산한다. 키보드/단일 터치 대체 버튼을 제공한다. 실험 센서는 탭으로 두 화분에 설치된다. 장면 순서는 위/아래 버튼으로 편집한다.

## 상태 저장

키: `life-clock-lab.mvp.1`, 저장 방식: localStorage JSON, version=1.

- completed, screen, pins, note, comparison
- seed, seedRun, day, snapshots, seedConclusion
- green, greenRun, analysis
- pair, pairStep, comparisons, classification, reasons, transfer
- artifact(title, summary, scenes), rings, motion

입력 즉시 저장한다. 실험을 완료할 때 조건 사본을 `seedRun`, `greenRun`으로 만들어 기록과 분리한다. 원본과 후속 관찰이 어긋나지 않도록 완료된 실험의 입력은 잠근다. 저장 오류는 안내하고 현재 세션을 유지한다. 손상된 JSON이나 지원하지 않는 버전은 초기 상태로 복구한다. IndexedDB/서버 동기화/여러 기기 병합은 MVP에 없다.

## 모형

발아: 물 있음과 알맞은 온도가 모두 충족될 때만 0~3단계 표현이 진행된다. 온실: 적절한 물/빛이 있는 경우 상대 성장 값이 더 빠르게 증가한다. 값은 조건 비교를 위한 임의의 상대 지표이며 실제 cm, 발아 확률, 발달 시점을 뜻하지 않는다. UI에 교육용 모형임을 표시한다. 실제 생물 사진 검수와 교육과정 전문가 감수는 후속 출시에 필요하다.

## 결과 출력

수집 자료의 id/표시 이름/도해 종류/근거를 작품 장면으로 복사한다. 사용자 설명과 별개로 원본 근거를 유지한다. Canvas 1600px 폭, 최대 6장면 / 2행으로 PNG를 생성한다. SVG 도해를 data URI 이미지로 읽으므로 외부 이미지 CORS 의존성이 없다. 파일 이름은 `생명시계_나의탐구기록.png`다.

## 접근성 및 표현

공통 색은 숲 녹색/크림/금색. 한글은 시스템 폰트. 글자와 UI를 배경에 굽지 않는다(별도 타이틀 이미지만 예외). 버튼/선택 조작은 기본 48px 이상이며 키보드 포커스를 표시한다. 체크와 문구로 상태를 함께 전달한다. 시스템 reduced-motion과 앱 설정을 지원한다. 태블릿 가로형에서 좌우 작업/기록 영역을 유지하고 좁은 모바일에서는 세로로 재배치한다. 긴 기록 영역과 편집기는 내부 스크롤을 허용한다.

## 운영과 배포

Node 서버는 개발용이며 loopback에만 바인딩한다. 서버는 경로 이탈을 차단하고 허용 확장자만 제공한다. 운영은 정적 HTTPS 호스팅을 사용한다. 외부 API, 로그인, 추적 SDK, API 키가 없다. 초기 에셋은 약 28MB이며 브라우저가 해당 화면의 배경을 요청한다. 정식 배포 때 제공 원본의 권리를 확인하고 용량 최적화를 진행할 수 있다.

## 알려진 한계

자유 메모 의미 분석 없음, 한 실험 기록 고정(반복 실험 이력 없음), 카메라/녹음/그리기 없음, 로컬 저장만 지원. 온실 센서는 위치 판단형 배치가 아닌 탭 설치. 생물 비교 이미지는 간략 SVG 도해다. 화분 뿌리 보기는 레이어 토글이며 3D 투명 토양은 사용하지 않는다.

## 공통 메뉴 상태 추가

`adminUnlocked`(기본 false), `sound`(기본 true), `navigationHistory`(최대 50개)를 저장한다. 기존 version=1 데이터는 freshState 기본값 병합으로 호환된다. canEnter는 0~9 범위에서 관리자 해금 또는 정상 진행을 검사한다. 관리자 미완료 페이지의 다음 이동은 complete를 호출하지 않는다. 홈/이전 이동도 입력 즉시 저장된 기록을 유지한다. 효과음은 사용자 클릭에서 AudioContext를 만들고 약 80ms의 낮은 볼륨 oscillator를 재생한다. 끄면 새로운 효과음 재생을 차단한다.
