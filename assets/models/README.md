# 3D 모델

메시(Meshy) Image to 3D로 만든 모델. 제작 목록·기본 이미지는 [3D-MODEL-BRIEF](../../docs/3d/3D-MODEL-BRIEF.md), 기본 이미지는 `source/`.

| 게임 파일 | 받은 원본 (`raw/`) | 삼각형 | 텍스처 | 크기 | 게임 연결 |
|---|---|---|---|---|---|
| `butterfly-egg.glb` | `butterfly-egg-meshy.glb` (Meshy 원본 이름 `Meshy_AI_Butterfly_Egg_1026013750_image-to-3d-texture.glb`, 41.7MB, 971,068 삼각형) | 48,000 (줄임) | WebP 1024 | 1.46MB | 나비의 숲 관찰 노트 |
| `butterfly-larva.glb` | `butterfly-larva-meshy.glb` (`…Pieris_Rapae_Caterpil_1026013852_texture.glb`, 7.7MB) | 15,700 (원본 그대로) | WebP 1024 | 0.88MB | 나비의 숲 관찰 노트 |
| `butterfly-pupa.glb` | `butterfly-pupa-meshy.glb` (`…Pieris_Rapae_Chrysali_1026013940_texture.glb`, 7.1MB) | 15,787 (원본 그대로) | WebP 1024 | 0.76MB | 나비의 숲 관찰 노트 |
| `butterfly-adult.glb` | `butterfly-adult-meshy.glb` (`…Pieris_Rapae_Adult_1026014352_texture.glb`, 7.4MB) | 15,596 (원본 그대로) | WebP 1024 | 1.05MB | 나비의 숲 관찰 노트 |
| `bean-seedling.glb` | `bean-seedling-meshy.glb` (`…Kidney_Bean_Seedling_1026014527_texture.glb`, 6.3MB) | 15,797 (원본 그대로) | WebP 1024 | 0.87MB | 아직 연결 안 함 (자리 결정 필요) |

- 만드는 법: `scripts/optimize-models.mjs` (맨 위 주석에 설치·실행 명령). 형태는 원본 그대로 두고 텍스처만 4096/2048 JPEG → 1024 WebP로 줄인다. 알만 삼각형을 줄였다.
- **블렌더 Decimate로 줄이지 않는다.** 블렌더 glTF 가져오기는 UV 경계에서 정점을 나누고, Decimate가 그 양쪽을 따로 당겨 모델이 찢어진다. 스크립트는 meshoptimizer로 경계 정점을 함께 옮기고, 줄인 뒤 구멍(열린 모서리)이 원본보다 늘면 파일을 쓰지 않는다. 알은 원본·결과 모두 열린 모서리 0.
- `raw/`는 git에 올리지 않는다(약 70MB). 다른 PC에서 다시 만들려면 메시에서 받아 같은 이름으로 넣는다. 빌드·서버는 `raw/`·`source/`를 배포에서 뺀다.
- 런타임: `field-specimen-3d.js`가 관찰 노트를 열 때만 `vendor/three-gltf-0.170.0.min.js`(three.js + GLTFLoader, MIT)와 GLB를 받는다. WebGL이 없거나 동작 줄이기 설정이면 지금 그림이 그대로 나온다.
