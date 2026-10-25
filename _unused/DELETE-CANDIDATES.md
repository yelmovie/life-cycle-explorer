# 보존·정리 후보 안내

2026-10-24. 이전 상세 목록은 [보관된 정리 기록](../archive/unused-assets/DELETE-CANDIDATES.md)에 있다. 이 문서는 현재 경로에서 찾을 수 있게 연결한 안내이며, 파일 삭제나 이동은 수행하지 않았다.

| 현재 경로 | 용량 | 정적 미사용 근거 | 처리 |
|---|---:|---|---|
| `assets/game/forestMap.webp` | 528,776 B | 활성 JS/CSS/HTML의 해당 직접 경로 참조 0건. 현재 forestMap은 `assets/expedition/forest-world.webp`를 참조 | 과거 manifest·버전 재현 가능성이 있어 보존 |
| `assets/field/source/guide-alpha-inspection.jpg` | 35,161 B | 활성 JS/CSS/HTML 직접 참조 0건. 투명 경계 검사용 합성본이며 빌드가 source 폴더를 제외 | 검사 증거로 보존 |

## 2026-10-25 이동 (`_unused/assets-game-20261025/`, 합계 1,183,898 B)

| 원래 경로 | 근거 | 처리 |
|---|---|---|
| `assets/game/bg0·bg1·bg3·bg5·bg9.webp` | 초기 장면 배경. 다섯 구역 방 배경(`field-scenes.js` `ROOM_BACKDROPS`)에 쓰이지 않는데 `SCENES` 목록 때문에 배포본·오프라인 캐시에 들어갔다 | 이동, `SCENES`에서 제외 |
| `assets/game/bg6.webp` | 사계절 정원 배경이었으나 실내 서재 그림이라 야외 정원 `assets/field/garden-seasons-v1.webp`로 교체 | 이동 |
| `assets/game/rose.webp` | `SCENES[7]` 자리만 차지. 장미 그림은 `assets/field/rose-shrub-v1.webp`를 쓴다 | 이동 |

실제 삭제는 하지 않았다. 되돌릴 때는 파일을 원래 경로로 옮기고 `game-assets.js`의 `SCENES`에 키를 다시 넣는다.

검색에서 `archive/`, `dist/`, `vendor/`를 제외했다. 정적 직접 참조가 없다는 사실만으로 동적 사용·과거 기록까지 미사용으로 확정하지 않는다.

`assets/video-production/20261024/`와 `20261024-motion/`은 제작 캔버스와 문서에서 사용하는 기준 이미지다. 게임 배포에 들어가지 않더라도 삭제 후보로 취급하지 않는다. 파일별 과거 인벤토리는 `assets/asset-inventory-20261021.json`, 최근 용량·중복 근거는 `docs/reviews/MUSIC-ASSETS-20261024.json`에서 확인한다.
