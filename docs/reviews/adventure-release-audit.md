# 모험 버전 — 결과물·자산·배포 준비 검증

검증일: 2026-10-15. 이 기록은 Lane C 담당 범위의 기술 점검이다. 전체 학습 흐름·화면·저장·실제 배포의 최종 판정은 통합 검증 결과를 따른다.

## 변경

- `adventure-export.js`: `exportStorybook({title, summary, cards})`가 PNG `Blob`을 반환한다. 다운로드 UI는 호출 측 책임이다. 카드 1~6개의 실제 제목·증거 설명·학생 설명·그림과 요약을 1800px 폭 포스터로 배치한다. 한글 단어/글자 경계에서 줄을 바꾸고 내용에 맞춰 행·전체 높이를 늘린다. 크림·녹색 카드, 실제 그림, `생명 시계 연구실 · 탐구 기록 / 모의 관찰` 표기를 사용한다. 빈 학생 설명을 임의의 학습 성과로 채우지 않는다.
- 이미지 입력은 같은 origin의 경로, raw SVG, data SVG, 내장 raster data URL을 지원한다. SVG 안의 같은 origin 이미지도 data URL로 내장한다. 외부 URL과 외부 SVG 이미지 참조는 요청 전에 거부한다. 스크립트·외부 스타일·외부 URL 속성을 제거하고 Object URL·타이머를 해제한다.
- `scripts/optimize-assets.py`: 기존 `assets/generated/source`와 새 `assets/adventure/source`를 함께 처리한다. 캐릭터/도구는 최대 768px, `leaf-world` 등 배경은 최대 1536×1024px, storybook은 최대 1536px이다. 걷기 시트는 전체를 2048×2048, 4×4 균등 셀, RGBA lossless WebP로 정규화한다. PNG 원본은 저장·삭제하지 않는다. 불투명하거나 정사각형이 아닌 걷기 시트는 오류로 알린다.
- `scripts/build.mjs`: `index.html`, `adventure.js`, `adventure.css`, `adventure-core.js`, `adventure-assets.js`, `adventure-map.js`, `adventure-export.js`, `assets.js`만 런타임으로 묶는다. 실제 참조 자산·모듈·스타일의 존재와 경로를 검사한다. 원본/참고 파일은 제외한다. 이전 dist에 현재 목록 밖 파일이 있으면 양쪽 절대 경로가 프로젝트 내부인지 확인한 뒤 `build-archive/dist-...`로 보존한다. 삭제나 기존 프로젝트 이동은 없다.
- `server.mjs`: 새 모험 모듈과 이미지 경로를 제공한다. source/raw-png/숨김·문서·빌드 보관 폴더는 제공하지 않는다. 기존 WebP MIME, HEAD/ETag, 보안 헤더를 유지한다.
- `package.json`: check 대상에 모험 모듈을 반영했다. start/test/build/preview 명령은 유지한다.

## 실제 실행한 검증

연결된 브라우저 도구에 사용 가능한 브라우저가 없어, 독립된 headless Edge 컨텍스트와 임시 loopback 서버(4198)에서 결과물 생성만 검증했다. 사용자 브라우저 프로필·기록은 사용하지 않았고 종료 후 테스트 서버와 브라우저를 닫았다. TEMP/TMP는 D드라이브를 사용했다.

| 검사 | 결과·증거 |
|---|---|
| export/server/build JS 문법 검사 | PASS · `node --check` |
| 6카드 결과물 | PASS · 실제 WebP 그림 4개 + 같은 origin 이미지를 포함한 raw SVG + data SVG. PNG 1800×1946, 774,142 bytes |
| 한글 장문 | PASS · 긴 제목, 공백 없는 한글, 여러 문단과 긴 요약 입력에서 PNG 높이가 2370px로 확장됨 |
| 6카드 장문 경계 계측 | PASS · 333번의 텍스트 그리기 좌표·실측 폭에서 캔버스 밖 출력 0건 |
| 생성 PNG 육안 검수 | PASS · 제목·카드·증거·설명·요약·푸터가 모두 보이며 이미지 정상, 카드 간 겹침과 잘림 없음. 샘플: `docs/reviews/adventure-storybook-smoke.png` |
| 외부 이미지 URL | PASS · 요청 전에 거부 |
| SVG 내부 외부 이미지 URL | PASS · 요청 전에 거부 |
| 카드 7개 | PASS · 설명을 포함한 오류로 거부 |
| 테스트 중 외부 요청 | PASS · 0건 |
| SVG 외부 스타일/기준 URL | PASS · xml-stylesheet, 외부 @import, xml:base를 포함한 시험 SVG도 외부 요청 0건. 같은 origin 이미지 정상 내장 |
| 최적화 크기/alpha 모형 검사 | PASS · 캐릭터 512×768, 가로 배경 1536×864, 걷기 시트 2048² RGBA. 잘못된 시트 2종 거부, 원본 입력 크기 유지 |
| 실제 걷기 시트 | PASS · 원본 1254² RGBA → 2048² RGBA lossless, 1,415,176 bytes. 시트 전체를 유지한 변환이며 셀별 포즈 품질은 UI 담당 검수 대상 |
| 실제 숲 배경 | PASS · 1536×864 WebP, 334,602 bytes |
| 신규 자산 26장 | PASS · `assets/adventure/*.webp` 26개, 합계 4,960,028 bytes. 추가 5장과 교정 pot-seed를 최적화했고 생성 원본 PNG 유지 |
| 모험 모듈·걷기 시트 HTTP | PASS · HEAD 200, JS/WebP MIME 정확, HEAD 본문 없음 |
| source/Source·빌드 보관 경로 | PASS · HTTP 404 |
| 통합 문법·상태 테스트 | PASS · `npm run check`, `npm test` 50/50 통과 |
| 최종 자산 포함 build | PASS · `npm run build`. manifest 생성 시각 2026-10-15T13:30:33.942Z. 런타임 8개 + 자산 60개 = 68개, 10,104,318 bytes (9.64 MiB) |
| dist 전체 HTTP GET | PASS · 68/68개 200. 실제 응답 본문 길이·Content-Length·MIME가 manifest와 일치 |
| 패키지 경계 | PASS · manifest 밖 파일 0개(검증용 manifest 자체 제외), 원본/source 경로 0개, 외부 URL 참조 0개(표준 SVG namespace 제외) |
| 비공개/없는 경로 | PASS · source, Source, raw-png, 문서, .git, build-archive, 서버, package.json, manifest, 없는 파일 등 11경로 404. 인코딩한 상위 경로 접근 403 |
| dist HTTP 계약 | PASS · WebP HEAD 200/본문 0 bytes, ETag 조건부 요청 304/본문 0 bytes, POST 405 |
| 전체 패키지 전송 계측 | PASS · 새 loopback 서버·새 HTTP 클라이언트에서 응답 캐시 없이 순차 GET 68회. 본문 10,104,318 bytes, 개별 요청 시간 합 337.67ms, 반복문 경과 338.30ms. HTTP 헤더 제외. OS 파일 캐시는 비우지 않았으며 브라우저 첫 화면·렌더링/FPS·학교망 성능 값이 아님 |

## 통합 완료 후 남은 검증

- UI 통합 검수 후 변경이 있으면 마지막 소스 기준으로 다시 build하고 manifest를 갱신.
- 완성된 UI에서 학생의 실제 카드 순서·제목·설명이 그대로 전달되고 다운로드되는지 확인.
- 실제 배포 주소·교실 기기·학교망은 이 로컬 기술 점검의 확인 범위가 아니다.

이번 build에는 새 UI와 생성 이미지 26장이 모두 포함되어 있다. 기존 기록의 검수 점수나 초기 로딩 수치를 새 버전에 그대로 적용하지 않는다. 이 build에서 이전 dist에 제거할 경로가 없어 보관 이동은 발생하지 않았으며, 기존 자료를 삭제하지 않았다.
