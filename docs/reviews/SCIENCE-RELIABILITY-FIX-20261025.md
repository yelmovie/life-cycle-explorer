# 생명 시계 연구실 0.7.1 수정·검증 — 2026-10-25

**운영 미배포.** 로컬 검토본은 0.7.1이다. Git 커밋·푸시·Cloudflare 운영 업로드를 실행하지 않았다. 기존 다섯 탐사·캐릭터·지도·2D 활동·보상·미디어를 유지했다.

## 1. 배포본과 소스 확인

- 운영: https://life-clock-lab.pages.dev / Cloudflare Pages 직접 업로드.
- 운영 배포 ID: `e8435015-5395-4948-9a46-48cbabb6651d`, 2026-10-25 10:28:20 KST 배포.
- 운영·작업 시작 시 소스: `777e903afc61b35cdc60c142b581cd17dfca2551`, 0.7.0. GitHub main도 같은 SHA임을 별도로 조회했다.
- 운영 캐시 `a4bdb608465432edc4f6`. HTTP 응답의 관련 실행 파일 **11개**를 실제 내려받아 로컬 기존 빌드·소스와 비교했고 모두 같았다. GitHub 커밋만으로 배포 일치를 추정하지 않았다.
- 수정본: 0.7.1, 위 커밋을 바탕으로 한 미커밋 변경. 로컬 후보 캐시 `fccea70cfa6968ca730f`, 실행 파일 50개·미디어 104개, 약 17.59 MiB. 미디어·폰트·라이선스 경로 **108개**의 SHA-256은 운영 원본과 동일하다.
- 검토 주소: http://127.0.0.1:4316 / 배포 폴더 검증 주소: http://127.0.0.1:4382 . 둘 다 로컬이다.

근거: [버전·11개 응답 대조](../../.tmp/fix-review-20261025/baseline/version.json), [운영 원본 manifest](../../.tmp/fix-review-20261025/baseline/build-manifest.json).

## 2. 수정 전 증거와 수정 후 동작

| 항목 | 수정 전 확인 방식·결과 | 수정 후 |
|---|---|---|
| 온실의 처진 잎 | **실제 UI 재현**. 물기·빛 측정 후 잎 버튼을 눌러도 `care-pin` 오답과 빈 관찰값이 남았다. | `{part, feature}`로 부위와 특징을 구분한다. 물 부족 사례의 마른 흙·처진 잎 모두 관찰 근거로 인정한다. 두 측정 전에는 진행하지 못하고, 돌봄 도구는 측정 결과로 판단한다. 처진 잎만으로 원인을 단정하지 않는 안내를 넣었다. 기존 dry/pale는 호환 필드로 유지한다. |
| 글 잘림·초안 | **실제 UI 재현**. 사진 설명·관찰 내용 200자 저장 후 180자. 사진을 바꿨다가 돌아오면 쓰던 초안 소실. 공백 제거는 저장 코드에서도 확인했다. | 공통 상수: 사진 설명·관찰 계획의 세 칸은 200자, 관찰글·추가 질문 180자, 제목 60자, 요약 300자. 과거 저장 한도보다 좁히지 않았다. 사진별·계획·관찰글·요약 초안을 별도 보관하며, 명시적 저장 전에는 제출·정답·완료에 반영하지 않는다. 앞뒤 공백·줄바꿈도 보존한다. |
| 힌트 | **실제 UI 재현**, 1180×757에서 앱 높이 757→868px. | 기존 하단 피드백 행을 재사용하는 짧은 패널. 열고 닫아도 과제문·관찰 대상·기록 버튼·다음 행동의 위치와 스크롤이 변하지 않는다. 닫기·Esc 후 원래 버튼으로 초점을 돌린다. 위치 안내는 글자를 덮는 표지 대신 테두리로 표시한다. |
| 씨앗의 결과 비교 | **실제 UI 재현**. 조건 버튼 하나만 눌러도 ‘예상과 결과 비교’ 성공 안내가 나왔다. | 같은 결과 단계에서 첫 예상과 실제 기록한 날짜별 A/B 사진을 보여 준다. 사진의 변화·바꾼 조건·예상과 같거나 생각을 수정했는지를 짧은 선택으로 남긴다. 틀린 예상 자체는 감점하지 않는다. 예전 완료 기록에는 새 응답을 만들어 넣지 않고 ‘이전 비교 응답 없음’으로 구분한다. |
| 그림 참고 모습 | **실제 UI 재현**. 어른벌레 선택 후 새로고침하면 참고가 애벌레로 돌아갔다. | 참고 생물을 저장·복원한다. 터치 그리기를 유지하고, 방향키와 Enter/Space로 직접 선을 그리는 동등한 키보드 방법을 제공한다. |
| 동작 줄이기 | **실제 UI 재현**. OS 설정이 켜져도 보상 캔버스에 재생 중 tween 1개가 남았다. | 앱 설정과 OS 설정을 공통 함수로 읽는다. 지도·보상·시계·캔버스·영상에 적용하고 OS 변경 시 자동 동작을 멈춘다. 줄이기에서도 사용자가 누른 영상 재생은 가능하다. |
| 기존 완성본 출력 | **추가 실제 UI 재현**. 재도전 중 1장짜리 초안이 있으면 기존 엔딩의 PNG가 그 초안을 출력했다. | 엔딩·기록증의 PNG는 화면에 표시한 완성본에서 출력한다. 작성 중인 초안 출력과 구분하며 기존 완성본·완료를 바꾸지 않는다. |
| 축약·조사·숙달 표현 | **정적 분석**. 관찰글 30자 출력에 생략 표시 없음, 원본 문구의 조사 오류, 수행 기록을 능력 판정으로 읽을 여지가 있었다. | 축약에 ‘…’를 붙이고 기록 상세에서는 전체 글을 제공한다. 이야기·계획 PNG와 읽기 화면은 전체 글·줄바꿈을 담는다. 원본 JSON과 실행 문구의 조사 오류를 교정했다. 완료·글자 수는 형식과 진행 확인이며, 관찰 근거·조건 비교·설명 연결은 교사가 확인하도록 안내한다. |

[수정 전 6개 재현](../../.tmp/fix-review-20261025/baseline/reproduction.json) · [씨앗·OS 추가 재현](../../.tmp/fix-review-20261025/baseline/additional-reproduction.json) · [재도전 출력 재현](../../.tmp/fix-review-20261025/baseline/retry-export.json) · [원본 조사 분석](../../.tmp/fix-review-20261025/baseline/static-grammar.json).

발아와 생장 조건의 구분, 다음 세대가 새로운 생명이라는 설명, 빛 부족 식물의 긴 줄기를 유지하고 새잎으로 회복을 표현하는 그림은 유지했다. 발아 비교는 ‘이 콩 실험에서 다른 조건을 같게 하고 물·온도를 비교했다’고 범위를 밝혔다.

## 3. 이번에 새로 실행한 검증

과거 자체 QA의 통과 횟수를 가져오지 않았다. 아래는 이번 수정 작업에서 새로 실행한 결과다.

- **일반 학생 실제 완주**: 깨끗한 격리 Chrome에서 사전 완료 기록·교사 해금 없이 시작했다. 다섯 탐사, 추가 발견 10개, 선택형 개념영상 열기, 엔딩, 이야기·기록증 PNG 저장, 최종 새로고침 복구를 실제 UI로 수행했다. 최종 배포 후보 폴더에서도 실행했다. 교사 시연·상태 주입을 이용한 부분 검사는 이 완주와 구분한다.
- **단위 161/161**, 실행·빌드 문법 42개 통과. 예전 dry/pale와 완료 기록, 사진·그림, 재도전 스냅샷 보존을 포함한다.
- **집중 UI 시나리오 15개**: 오답→수정, 연속 클릭, 뒤로 이동, 부분 저장→새로고침, 사진별 초안, 기존 완료자의 재도전, 기존 완성본·기록증 출력, 교사 초안과 학생 원본 분리를 확인했다.
- **180·181·200자**: 한글·공백·앞뒤 줄바꿈을 넣어 저장→다른 사진→복귀→새로고침→PNG를 수행했다. 실제 PNG 그리기에 전달된 문자열과 원문을 비교했고 다운로드한 결과도 확인했다. 계획·사진 설명 모두 유지됐다. 계획 대상·시점의 예전 180자 저장 범위도 줄이지 않고 200자까지 보존한다.
- **1280×800·1024×768**: 48개 대표 상태씩 **96개 화면**, 컨트롤 682개 측정. 48px 미만 0, 가림·겹침·잘림 탐지 0, 실행·요청 오류 0. 이 레이아웃 검사의 상태 준비용 fixture는 이번 학생 완주 결과에서 만들었으며 완주 증거로 사용하지 않았다.
- **1180×757 힌트**: 추가 스크롤 0. 닫기·Esc 초점 복귀, ‘다음 특징 살피기’ 후 과제문 유지 확인.
- **터치 모사**: 1024×768 Chrome 터치 입력으로 잎 선택·반복 탭·그림 입력·새로고침 복구를 확인했다. **실태블릿 시험은 아니다.**
- **회전**: 작성 중 세로로 돌렸을 때 실제 최상단 회전 안내와 초점을 확인했다. 가로 복귀 후 글·참고 생물·그림이 유지된다.
- **OS 동작 줄이기**: 저장 옵션이 false인 상태에서도 지도·보상의 자동 tween 0, 영상 자동 재생 정지, 직접 재생과 OS 변경 후 정지를 확인했다.
- **출력·배포 폴더**: manifest 154개, 소스/빌드 153개, 로컬 HTTP 9개 대조. 새 시작·개인 기록이 들어간 엔딩도 확인했다.

[일반 학생 완주 결과](../../.tmp/fix-review-20261025/dist-student-final/result.json) · [집중 UI 집계](../../.tmp/fix-review-20261025/targeted-summary.json) · [96개 화면](../../.tmp/responsive-20261025-request-fixes-20261025/result.json) · [로컬 배포 후보 검사](../../.tmp/fix-review-20261025/dist-smoke/result.json).

대표 화면: [밀리지 않는 힌트](../../.tmp/fix-review-20261025/targeted-final/hint-open-1180-757.png), [세로 작성 보호](../../.tmp/fix-review-20261025/targeted-final/portrait-writing.png), [200자 PNG](../../.tmp/fix-review-20261025/published-writing-final/writing-200.png).

## 4. 범위·남은 한계

- **실제 태블릿 터치 미검증**: 연결 가능한 실기기가 없다는 사용자 확인에 따라 미검증으로 남긴다. iPad/Android 실기기·키보드·펜의 특성까지 통과했다고 주장하지 않는다.
- 1024×768에서 씨앗 시간·동물 시간은 4px, 계절 화면은 60px의 **단일 앱 페이지 스크롤**을 사용한다. 조작부 도달과 가림은 확인했다. 나비 힌트로 추가되는 스크롤이나 힌트 내부 중첩 스크롤은 없다.
- 이전 버전에서 이미 잘려 저장된 부분은 원문이 따로 없으면 되살릴 수 없다. 현재 남아 있는 글과 유효한 학생 기록은 보존하며 이후의 허용 입력 손실을 막았다.
- 실제 학생의 개념 숙달·학습 효과는 이번 기술 검사의 판정 대상이 아니다. 교사에게 관찰 근거와 설명을 확인하도록 안내한다.
- 이번에는 접속 실패가 재현되지 않았다. 운영 응답과 파일을 확인했으며, 사용자의 저장소·기존 서비스워커를 삭제해 문제를 해결하지 않았다. 특정 실사용 브라우저의 기존 캐시 조합은 별도 미검증이다.

## 5. 수정 파일

주요 데이터·활동: `field-model.js`, `game-model.js`, `field-writing.js`, `field-plant-scenes.js`, `field-flow.js`, `field-preview.js`.
글·출력: `field-story-scenes.js`, `field-dialogs.js`, `adventure-export.js`, `field-record-art.js`, `field-certificate.js`.
안내·접근성: `game-app.js`, `game.css`, `field-observation-scenes.js`, `game-motion.js`, 지도·보상·시계·퀘스트 렌더러의 공통 동작 줄이기 호출.
원본 문구: `content/field-missions.json` 및 생성 파일, `field-content.js`, `field-companion.js`, `settings-content.js`와 관련 활동 문구.
빌드·서버·테스트도 새 공통 모듈과 응답 기록에 맞게 갱신했다. 프레임워크·미디어 파일은 바꾸지 않았다.

전체 변경 경로:
- `README.md`
- `adventure-export.js`
- `content/field-missions.json`
- `field-certificate.js`
- `field-clock.js`
- `field-companion.js`
- `field-content.js`
- `field-dialogs.js`
- `field-flow.js`
- `field-mission-data.js`
- `field-model.js`
- `field-observation-scenes.js`
- `field-plant-scenes.js`
- `field-preview.js`
- `field-quest-state.js`
- `field-quests.js`
- `field-record-art.js`
- `field-room-scenes.js`
- `field-scenes.js`
- `field-story-scenes.js`
- `field-world-effects.js`
- `field-writing.js`
- `game-app.js`
- `game-info.js`
- `game-model.js`
- `game-motion.js`
- `game.css`
- `package.json`
- `scripts/build.mjs`
- `scripts/check.mjs`
- `scripts/qa-final-release.mjs`
- `scripts/qa-recovery-play.mjs`
- `scripts/qa-request-fixes-20261025.mjs`
- `scripts/qa-responsive-20261025.mjs`
- `server.mjs`
- `settings-content.js`
- `tests/field-model.test.js`
- `tests/field-plant-science.test.js`
- `tests/field-quests.test.js`
- `tests/field-request-fixes.test.js`
