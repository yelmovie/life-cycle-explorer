# 에셋 보존·정리 후보

2026-10-21 정적 검색 기록. **아무 파일도 삭제하지 않았다.** 정적 참조가 없다는 사실만으로 미사용을 확정하지 않는다. 이전 버전 스크립트·동적 경로·manifest가 과거 파일을 참조할 수 있다.

| 대상 | 용량 | 근거 | 위험·처리 |
|---|---:|---|---|
| `assets/game/forestMap.webp` | 528,776 B | 현재 `game-assets.js`의 forestMap은 `assets/expedition/forest-world.webp`를 사용. 코드의 직접 경로 참조 없음 | 이전 버전·manifest 재현용 보존. 정리 승인 후에도 삭제 대신 별도 보관 권장 |
| `assets/raw-png/` 내부 SHA-256 동일 파일 5쌍 | 상세 inventory | 동일 바이트 확인 | 작업 이력 보존. 변경 안 함 |
| 루트 `assets/scene-*.png`, `title.png`, `characters.png` | 개별 1.8~2.7 MiB | 최초 사용자 제공 PNG의 대응표와 과거 코드에 연결 | 원본이며 미사용 확정 아님. 빌드 참조 그래프가 제외하도록 유지 |
| `assets/generated/source/`, `adventure/source/`, `expedition/source/`, `field/source/` | 전체 원본 목록 참조 | 생성 원본·프롬프트 대응, 실행용 사본은 WebP | 삭제 금지. 빌드에서 source 폴더 제외 |
| `assets/field/source/guide-alpha-inspection.jpg` | inventory 참조 | 이번 투명 경계 검사용 합성 이미지 | 실행용 아님. source 폴더 안에서 보존 |

파일별 경로·바이트·해시·직접 참조 근거: `assets/asset-inventory-20261021.json`. 이 목록과 이전 아카이브를 이동하려면 먼저 경로·재현 요구·실행 참조를 다시 확인한다.
