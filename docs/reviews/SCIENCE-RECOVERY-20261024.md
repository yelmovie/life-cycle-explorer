# 중단 후 과학·미디어 복구 확인

2026-10-24. `FULL-SCIENCE-AUDIT-20261024.md`에서 전달한 미반영 항목을 실제 파일과 출력 그림으로 재확인했다.

## 수정 완료

- `field-record-art.js`: 빛 부족 돌봄 뒤에도 기존 `pale`의 긴 줄기를 유지하고 세 줄기 끝에 새 초록잎 모형만 추가한다. 회복 시점은 공통 `careTimeLabels`의 ‘새잎이 자란 뒤’를 사용한다. 물/빛 돌봄 사진에 실제 회복 시간은 다르다는 문구를 표시한다.
- 동물 비교 기록은 `fieldEvidence.photos`에 실제 기록한 단계만 표시한다. 처음과 끝만 찍었다면 중간의 애벌레·번데기·어린 개 사진을 만들어 넣지 않는다.
- `scripts/render-concepts.mjs`: 같은 새잎 좌표를 공유한다. `balsamSeeds`는 씨앗만의 사진이 아니라 씨앗이 달린 식물 전체이므로 다음 봄 아래에 작게 중복 표시하던 부분을 씨앗 모형으로 고쳤다.
- `care`와 `seasons`의 MP4/WebM/포스터를 다시 렌더했다. 기존 `seasons.mp4`는 0.875초만 기록된 중단 파일이었다. 렌더 스크립트는 임시 결과 3개가 완성된 뒤 교체하여, 렌더 중 중단되어도 기존 정상 결과를 유지한다.
- 새 개 3단계 에셋을 재사용했다. 영상 0.2/1.5/3.5초 프레임에서 눈을 감은 새끼, 어린 개, 같은 골든 리트리버 외형의 성체를 확인했다.
- `leaf.webp`는 잎 뒤 숲 배경까지 포함한 불투명 이미지이고, `rose.webp`는 장미가 아닌 `scene-08` 실험실 배경이었다. 투명한 잎과 목질 줄기가 있는 장미 덤불을 내장 image_gen으로 제작했다. 원본 파일은 다른 배경 사용을 위해 보존한다.

## 새 에셋

| 용도 | 실행 파일 | 확인 |
|---|---|---|
| 잎 | `assets/field/leaf-isolated-v1.webp` | 900×507, alpha 있음, isOpaque=false |
| 장미 | `assets/field/rose-shrub-v1.webp` | 900×822, alpha 있음, isOpaque=false |

PNG 원본은 `assets/field/source/`, 정확한 프롬프트와 제작 방법은 `assets/field/science-recovery-generation.json`에 보존했다. 생성 후 크기 조정·WebP 인코딩만 했고 별도 배경 마스킹은 하지 않았다.

## 영상 구성

`ai-video-prompt` 지침을 적용했다. 외부 영상 생성 호출 없이 기존 로컬 모션 그래픽을 렌더했다. 모든 장면은 고정 카메라, 정면 관찰 시점, 생물 전체가 보이는 구도로 유지한다. 같은 식물의 줄기와 같은 품종의 개를 고정한다.

| 영상 | 0–4초 | 4–8초 | 8–12초·종료 구도 |
|---|---|---|---|
| 돌봄 | 같은 두 화분과 돌봄 도구 | 물 모형 변화, 빛 모형의 새잎 등장 | 긴 줄기가 유지된 두 화분 비교; 마지막 구도 1.2초 정지 |
| 한살이 비교 | 나비와 개의 성장 단계 | 사과나무·봉선화 계절 변화 | 같은 사과나무와 씨앗에서 나온 봉선화; 마지막 구도 1.2초 정지 |

## 검증

- 과학/노트/기록 관련 단위 검사 11개 통과: `node --test tests/field-record-art.test.js tests/field-notebook.test.js tests/field-plant-science.test.js`.
- `node --check scripts/render-concepts.mjs` 통과.
- care/seasons MP4(H.264)·WebM(VP9) 4개 모두 12초·960×540·24fps. FFmpeg 전체 디코딩 오류 없음.
- 수정한 care 포스터와 seasons의 생후 초기/어린 개/성체 프레임을 시각 확인했다. 기존 긴 줄기가 짧아지거나, 다음 봄 새싹 아래에 다른 성체가 겹치는 표현을 제거했다.
- 통합 단계에서 `graphify update .`로 코드 지식 그래프를 갱신했다.

## 근거와 범위

- [미네소타대 Extension의 빛 부족 설명](https://extension.umn.edu/garden-and-home/yard-and-garden/gardening-in-minnesota/lighting-for-indoor-plants): 빛 부족으로 잎 색이 옅어지고 줄기 마디 사이가 길어지는 현상을 확인했다. 회복을 기존 줄기가 줄어드는 그림으로 표현하지 않는다.
- 기존 감사표의 [Texas A&M 수의대 생후 초기 강아지 자료](https://vetmed.tamu.edu/news/pet-talk/puppy-timeline-part-1/)는 이번 접근에서 403이어서 다시 읽지는 못했다. 기존 검토와 눈을 감은 새끼·같은 품종 에셋이라는 실제 그림 확인을 구분했다.
- 기록화 및 영상 자체 검증 결과다. 게임 전체 버튼 조작·저장·완료 화면 검증은 통합 검증에서 수행한다. 커밋·배포하지 않았다.

## 추가 요청: 저장 원본 보호

사용자가 추가한 공통 `final-check/references/record-and-release-checks.md`의 저장 절을 읽고 `game-model.js`의 저장 경로를 보강했다.

- 정상 빈 저장소만 새 활동으로 시작한다. 깨진 JSON(빈 문자열 포함), `null`, 잘못된 필수 컨테이너, 미지원 최상위/field/expedition 버전은 기본 화면을 열어도 원문을 덮어쓰지 않는다.
- 저장소 객체별 WeakMap에 읽은 키/원문을 보관한다. 자동 저장 전 다시 읽은 값이 달라졌다면 충돌로 차단한다. 이는 변경 감지이며 읽기와 쓰기 사이의 경쟁까지 막는 원자적 잠금은 아니다.
- `getSaveStatus(storage)`는 `{ok, reason, sourceKey, raw, expectedRaw}`를 반환한다. `raw`는 원문 보관용으로 마지막 읽을 수 있었던 문자열이며 검증된 복원 백업임을 뜻하지 않는다. 읽기 실패 시 `expectedRaw`는 null이다.
- `resetGame(storage, freshState, expectedRaw)`는 확인창을 열 때 받은 모든 관련 키의 원문이 그대로일 때만 초기화한다. 확인 중 다른 창이 새로 저장했으면 거절한다.
- 정상 v2/v3 구버전은 진행·그림·사진을 유지해 현재 키로 이어가고 구버전 키는 수정하지 않는다. 과거 field v1에 새 선택 탐구 속성이 없더라도 정상 이관한다.
- `tests/game-model.test.js` 총 18개 통과. 실제 사용자 저장소가 아닌 Map 기반 가짜 저장소로 반복 자동저장, 읽기 실패, 용량 부족, 다른 창 변경, 오래된 초기화 확인, 구버전 보존을 검증했다. UI 연결은 통합 담당자가 적용한다.
