# 보존·정리 후보 안내

2026-10-24. 이전 상세 목록은 [보관된 정리 기록](../archive/unused-assets/DELETE-CANDIDATES.md)에 있다. 이 문서는 현재 경로에서 찾을 수 있게 연결한 안내이며, 파일 삭제나 이동은 수행하지 않았다.

| 현재 경로 | 용량 | 정적 미사용 근거 | 처리 |
|---|---:|---|---|
| `assets/game/forestMap.webp` | 528,776 B | 활성 JS/CSS/HTML의 해당 직접 경로 참조 0건. 현재 forestMap은 `assets/expedition/forest-world.webp`를 참조 | 과거 manifest·버전 재현 가능성이 있어 보존 |
| `assets/field/source/guide-alpha-inspection.jpg` | 35,161 B | 활성 JS/CSS/HTML 직접 참조 0건. 투명 경계 검사용 합성본이며 빌드가 source 폴더를 제외 | 검사 증거로 보존 |

검색에서 `archive/`, `dist/`, `vendor/`를 제외했다. 정적 직접 참조가 없다는 사실만으로 동적 사용·과거 기록까지 미사용으로 확정하지 않는다.

`assets/video-production/20261024/`와 `20261024-motion/`은 제작 캔버스와 문서에서 사용하는 기준 이미지다. 게임 배포에 들어가지 않더라도 삭제 후보로 취급하지 않는다. 파일별 과거 인벤토리는 `assets/asset-inventory-20261021.json`, 최근 용량·중복 근거는 `docs/reviews/MUSIC-ASSETS-20261024.json`에서 확인한다.
