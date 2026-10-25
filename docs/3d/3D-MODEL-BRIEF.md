# 3D 모델 제작 목록 — 생명 시계 연구실

> 작성 2026-10-25 · 기본 이미지 폴더: `assets/models/source/` · 한눈에 보기: `assets/models/source/_contact-sheet.jpg`
> GLB는 메시(Meshy)에서 만들어 `assets/models/`에 넣는다. 넣은 뒤 블렌더 정리·압축·게임 연결은 이쪽에서 한다.

---

## 1. 3D를 넣을 자리 (우선순위 순)

| 순위 | 장면 | 3D로 하는 일 | 왜 3D여야 하나 | 모델 |
|---|---|---|---|---|
| 1 | 나비의 숲 · 표본 관찰 | 표본을 눌러 확대창에서 손가락으로 돌려 보기 | 다리 6개·몸마디·더듬이는 한 방향 그림으로는 안 보인다. 돌려 봐야 "서로 다른 두 부분 관찰" 활동이 진짜가 된다 | 01~04 |
| 2 | 각 탐사 보상 화면 | 도구가 빙글 돌며 내려와 손에 들어오는 획득 연출 | 지금은 평면 그림이 뜨고 끝난다. 받은 도구를 돌려 볼 수 있으면 성취감이 확실히 커진다 | 08~11 |
| 3 | 생명 시계탑 · 엔딩 직전 | 시계 몸체에 금빛 고리·잎 핵이 끼워지고 시계가 다시 도는 5초 연출 | "멈춘 숲의 시간을 되살린다"는 이야기 결말을 눈으로 보여 주는 장면 | 05~07 |
| 4 | 첫 화면 · 도토 힌트 | 도토가 손 흔들기·고개 갸웃 같은 짧은 동작 | 마스코트가 살아 움직이면 첫인상이 달라진다 (선택) | 12 또는 14 |
| 5 | 씨앗 연구소 (선택) | 강낭콩 싹을 돌려 떡잎·뿌리 보기 | 떡잎과 본잎, 뿌리 위치 구분에 도움 | 13 |

공통 원칙: 3D는 **확대창·보상창·엔딩 연출 안에서만** 쓴다. 숲길 지도와 활동 화면은 지금의 2D를 유지한다. 3D를 못 여는 기기·동작 줄이기 설정에서는 지금 그림이 그대로 나온다.

---

## 2. 메시 공통 설정 (모든 모델에 똑같이)

```
메뉴: Image to 3D
이미지: assets/models/source/ 의 번호 파일 1장
토폴로지: Triangle
대칭(Symmetry): 아래 표의 값
텍스처: 켬 / PBR: 켬
리메시(Remesh): 켬, 목표 폴리곤 = 아래 표의 숫자
내보내기: GLB
```

| 규격 | 값 | 이유 |
|---|---|---|
| 텍스처 | 1024×1024 이하 | 태블릿 메모리 |
| 파일 크기 | 압축 후 개당 2MB 이하 (받은 원본은 커도 됨) | 오프라인 캐시가 이미 17.6MiB |
| 받은 원본 | 그대로 `assets/models/`에 넣기 | 압축·정리는 이쪽에서 무손실부터 처리 |
| 파일 이름 | 아래 표의 GLB 이름 그대로 | 코드 연결 이름과 맞춘다 |

> 메시 화면의 메뉴 이름은 버전마다 조금 다를 수 있어. 핵심은 **목표 폴리곤 숫자를 꼭 넣는 것**이야. 안 넣으면 수십만 개로 나와서 태블릿이 버벅인다.

---

## 3. 전체 목록

| 번호 | 대상 | 기본 이미지 | 출처 | GLB 이름 | 목표 삼각형 | 대칭 | 움직임 |
|---|---|---|---|---|---|---|---|
| 01 | 배추흰나비 어른벌레 | `01-butterfly-adult.png` | **새로 생성** (힉스필드) | `butterfly-adult.glb` | 24,000 | 켬 | 날갯짓은 코드로 (날개 분리 불필요) |
| 02 | 배추흰나비 알 | `02-butterfly-egg.png` | 기존 `assets/generated/source/butterfly-egg.png` | `butterfly-egg.glb` | 8,000 | 자동 | 없음 |
| 03 | 애벌레 | `03-butterfly-larva.png` | 기존 `assets/generated/source/butterfly-larva.png` | `butterfly-larva.glb` | 16,000 | 끔 | 없음 |
| 04 | 번데기 | `04-butterfly-pupa.png` | 기존 `assets/generated/source/butterfly-pupa.png` | `butterfly-pupa.glb` | 10,000 | 끔 | 없음 |
| 05 | 생명 시계 몸체 | `05-life-clock-body.png` | 기존 `assets/generated/source/m10-clock-body.png` | `life-clock-body.glb` | 20,000 | 켬 | 없음 |
| 06 | 시계 금빛 고리 | `06-life-clock-ring.png` | 기존 `assets/generated/source/m10-clock-ring.png` | `life-clock-ring.glb` | 4,000 | 켬 | 회전은 코드로 |
| 07 | 시계 잎 핵 | `07-life-clock-core.png` | 기존 `assets/generated/source/m10-clock-core.png` | `life-clock-core.glb` | 4,000 | 켬 | 빛남은 코드로 |
| 08 | 시간 손잡이 | `08-time-wheel.png` | **새로 생성** (기존 정면 그림을 3/4로) | `tool-time-wheel.glb` | 8,000 | 끔 | 없음 |
| 09 | 관찰 센서 | `09-plant-sensor.png` | **새로 생성** | `tool-plant-sensor.glb` | 8,000 | 켬 | 없음 |
| 10 | 계절 나침반 | `10-season-compass.png` | **새로 생성** | `tool-season-compass.glb` | 8,000 | 끔 | 없음 |
| 11 | 이야기 카메라 | `11-story-camera.png` | 기존 `assets/expedition/source/explorer-tools.png` 오른쪽 아래 잘라냄 | `tool-story-camera.glb` | 10,000 | 끔 | 없음 |
| 12 | 도토 (리깅용 A자세) | `12-doto-apose.png` | **새로 생성** | `doto-rigged.glb` | 18,000 | 켬 | 메시 자동 리깅 → 손 흔들기·대기 |
| 13 | 강낭콩 싹 (선택) | `13-bean-seedling.png` | 기존 `assets/generated/source/m04-bean-s3.png` | `bean-seedling.glb` | 10,000 | 끔 | 없음 |
| 14 | 도토 (도토리 든 원래 자세, 리깅 안 할 때) | `14-doto-original.png` | 기존 `assets/field/source/doto-20261022.png` | `doto-static.glb` | 18,000 | 끔 | 없음 |

- 1순위만 먼저 하려면 **01~04** 네 개. 그다음 **08~11**, **05~07** 순서.
- 12와 14는 둘 중 하나만 있으면 된다. 움직이게 하려면 12.
- 새로 생성한 5장은 기존 그림을 참고 이미지로 넣어 색·모양을 맞췄다. 원본은 `assets/models/source/raw/`, 생성 기록은 `assets/models/source/generation.json`.

---

## 4. 모델별 복붙 카드

메시 Image to 3D에 이미지를 넣고, 텍스처 설명 칸이 있으면 **텍스처 프롬프트**를 붙여 넣는다. 결과가 이상하면 **다시 그리기 프롬프트**로 힉스필드에서 기본 이미지를 다시 뽑는다.

### 01 · 배추흰나비 어른벌레 — `butterfly-adult.glb`

- 기본 이미지: `assets/models/source/01-butterfly-adult.png`
- 목표 24,000 삼각형 · 대칭 켬
- 확인할 것: **다리 6개**, 머리·가슴·배 세 부분, 곤봉 모양 더듬이 2개, 앞날개 검은 점 2개씩

텍스처 프롬프트
```
Photorealistic cabbage white butterfly (Pieris rapae). Creamy white wings with fine veins, charcoal grey wingtips, two black spots on each forewing, pale yellow underside of the hindwings, soft grey hairy body, black eyes, clubbed antennae with pale tips, six thin dark jointed legs. Natural matte materials, no glossy plastic look.
```

다시 그리기 프롬프트 (힉스필드 · 참고 이미지 `assets/generated/source/butterfly-adult.png`)
```
Photorealistic cabbage white butterfly (Pieris rapae) matching the reference specimen exactly: creamy white wings, charcoal grey wingtips, two black spots on each forewing, slender grey hairy body with clearly separated head, thorax and abdomen, long clubbed antennae, and exactly six thin jointed legs. New pose: the butterfly stands on its six legs with wings half-raised in a soft V shape (about 60 degrees open), so the upper wing surface, the underside, the body, the legs and the head are all visible at once. Three-quarter front view from slightly above (about 30 degrees elevation). Single object only, centered, entire butterfly fully visible with generous margin, soft even studio lighting, no cast shadow, no ground, no leaf, no text, transparent background, clean silhouette. Reference image for image-to-3D model creation.
```

### 02 · 배추흰나비 알 — `butterfly-egg.glb`

- 기본 이미지: `assets/models/source/02-butterfly-egg.png` (잎 위에 선 알)
- 목표 8,000 · 대칭 자동
- 확인할 것: 길쭉한 옥수수알 모양, 세로 줄무늬, 연노랑 색. 잎은 받침으로 같이 나와도 됨

텍스처 프롬프트
```
Single cabbage white butterfly egg standing upright on a small piece of green cabbage leaf. Pale lemon-yellow spindle-shaped egg with fine vertical ridges and tiny cross ribs, slightly translucent. Leaf with light veins and fine hairs on the edge. Photorealistic macro, matte natural materials.
```

### 03 · 애벌레 — `butterfly-larva.glb`

- 기본 이미지: `assets/models/source/03-butterfly-larva.png` (잎 위 옆모습)
- 목표 16,000 · 대칭 끔
- 확인할 것: 몸마디가 구분되는지, 앞쪽 가슴다리와 뒤쪽 배다리가 보이는지, 옆줄 노란 선

텍스처 프롬프트
```
Green cabbage white caterpillar crawling on a cabbage leaf. Soft velvety green body with clear segments, thin yellow line along each side, tiny black spiracle dots, short fine hairs, small true legs at the front and stubby prolegs underneath. Photorealistic macro, matte natural materials.
```

### 04 · 번데기 — `butterfly-pupa.glb`

- 기본 이미지: `assets/models/source/04-butterfly-pupa.png` (나뭇가지에 붙은 번데기)
- 목표 10,000 · 대칭 끔
- 확인할 것: 위쪽 뾰족한 머리 부분, 허리를 감은 실(띠실), 나뭇가지와 이어진 부분

텍스처 프롬프트
```
Pale green cabbage white butterfly chrysalis attached to a thin brown twig with a silk girdle. Angular pointed head end, faint yellow side ridge, tiny dark dots, slightly waxy surface. Brown twig with small buds. Photorealistic macro, natural materials.
```

### 05 · 생명 시계 몸체 — `life-clock-body.glb`

- 기본 이미지: `assets/models/source/05-life-clock-body.png`
- 목표 20,000 · 대칭 켬
- 확인할 것: 가운데 구멍(고리·핵이 들어갈 자리)이 뚫려 있는지, 받침의 잎 장식

텍스처 프롬프트
```
Stylized storybook laboratory clock for a children's science game. Cream enamel round face with concentric grooves and an open round socket in the center, polished brass rim and side pivots, light beech wood pedestal with a green enamel three-leaf emblem and brass base ring. Soft hand-painted PBR look, warm and friendly.
```

### 06 · 시계 금빛 고리 — `life-clock-ring.glb`

- 기본 이미지: `assets/models/source/06-life-clock-ring.png`
- 목표 4,000 · 대칭 켬

텍스처 프롬프트
```
Thick brushed brass ring, warm gold color, smooth rounded edges, subtle fine brushing marks. Stylized game prop, clean PBR metal.
```

### 07 · 시계 잎 핵 — `life-clock-core.glb`

- 기본 이미지: `assets/models/source/07-life-clock-core.png`
- 목표 4,000 · 대칭 켬

텍스처 프롬프트
```
Round button-shaped clock core: soft mint-green glazed ceramic dome with a raised dark green leaf relief, thin polished brass bezel. Stylized game prop, clean PBR materials.
```

### 08 · 시간 손잡이 — `tool-time-wheel.glb`

- 기본 이미지: `assets/models/source/08-time-wheel.png` (새로 생성, 3/4 각도)
- 목표 8,000 · 대칭 끔 (오른쪽 아래 손잡이 때문)

텍스처 프롬프트
```
Round time-control dial medallion: mahogany wood outer ring carved with leaf vines and small green enamel leaves, polished brass inner ring with round brass rivets, blank cream enamel face, green enamel leaf ornament at the top, brass hanging loop, side crank with a turned wooden knob and brass cap. Stylized hand-painted game prop with soft PBR materials.
```

다시 그리기 프롬프트 (힉스필드 · 참고 이미지 `assets/expedition/timeWheel.webp`)
```
The same object as the reference: a round time-control dial medallion for a children's science adventure game. Mahogany wood outer ring carved with leaf vines and small green enamel leaves, polished brass inner ring with round brass rivets, blank cream enamel face, green enamel leaf ornament at the top, brass hanging loop at the top, and a side crank handle with a turned wooden knob at the lower right. Show it as a solid 3D object with visible thickness (about 18 percent of its diameter): three-quarter view, turned 30 degrees to the left and tilted back 15 degrees, so the edge thickness, the rim depth and the crank are clearly readable. Keep the reference colors and the stylized hand-painted game-prop look with soft physically based materials. Single object only, centered, fully visible with margin, soft even studio lighting, no cast shadow, no ground, no text, transparent background. Reference image for image-to-3D model creation.
```

### 09 · 관찰 센서 — `tool-plant-sensor.glb`

- 기본 이미지: `assets/models/source/09-plant-sensor.png`
- 목표 8,000 · 대칭 켬

텍스처 프롬프트
```
Plant moisture-and-light sensor gadget: rounded dark green enamel body with polished brass trim, cream gauge face with a brass needle, a blue water-drop button and a yellow sun button, a green leaf on each side, brass top loop with a small leaf, two brass-tipped green probe prongs. Stylized hand-painted game prop with soft PBR materials.
```

다시 그리기 프롬프트 (힉스필드 · 참고 이미지 `assets/expedition/plantSensor.webp`)
```
The same object as the reference: a plant moisture-and-light sensor gadget for a children's science adventure game. Rounded dark green enamel body with polished brass trim, cream gauge face with a brass needle, a small blue water-drop button and a yellow sun button, one green leaf on each side, a brass top loop with a small leaf, and two brass-tipped green probe prongs pointing down. Show it as a solid 3D object with visible depth (body about 25 percent as deep as it is wide), standing upright, three-quarter view turned 30 degrees, seen slightly from above, so the side thickness, the buttons and the prongs are clearly readable. Keep the reference colors and the stylized hand-painted game-prop look with soft physically based materials. Single object only, centered, fully visible with margin, soft even studio lighting, no cast shadow, no ground, no text, transparent background. Reference image for image-to-3D model creation.
```

### 10 · 계절 나침반 — `tool-season-compass.glb`

- 기본 이미지: `assets/models/source/10-season-compass.png`
- 목표 8,000 · 대칭 끔 (계절 그림이 위치마다 달라서)
- 확인할 것: 위 봄(꽃봉오리)·오른쪽 여름(나무)·아래 가을(단풍)·왼쪽 겨울(눈송이) 순서

텍스처 프롬프트
```
Seasons compass medallion: round mahogany wood body with four raised enamel inlays, pink flower bud for spring at the top, green tree for summer on the right, orange maple leaf for autumn at the bottom, blue snowflake for winter on the left; brass leaf-shaped points between them, cream center face with a green leaf-shaped brass needle, brass hanging loop. Stylized hand-painted game prop with soft PBR materials.
```

다시 그리기 프롬프트 (힉스필드 · 참고 이미지 `assets/expedition/seasonCompass.webp`)
```
The same object as the reference: a seasons compass medallion for a children's science adventure game. Round mahogany wood body with four round enamel inlays at the cardinal points: pink flower bud for spring at the top, green tree for summer on the right, orange maple leaf for autumn at the bottom, blue snowflake for winter on the left; brass leaf-shaped points between them, a cream center face with a green leaf-shaped brass needle, and a brass hanging loop at the top. Show it as a solid 3D object with visible thickness (about 15 percent of its diameter): three-quarter view, turned 30 degrees to the left and tilted back 15 degrees, so the rim thickness and the raised inlays are clearly readable. Keep the reference colors and the stylized hand-painted game-prop look with soft physically based materials. Single object only, centered, fully visible with margin, soft even studio lighting, no cast shadow, no ground, no text, transparent background. Reference image for image-to-3D model creation.
```

### 11 · 이야기 카메라 — `tool-story-camera.glb`

- 기본 이미지: `assets/models/source/11-story-camera.png`
- 목표 10,000 · 대칭 끔

텍스처 프롬프트
```
Storybook nature camera: glossy forest-green enamel body with brass trim and brass vine-and-leaf ornaments, large brass-ringed lens reflecting a tiny forest, brass shutter button and dial, brown stitched leather side grips and strap loops, an instant photo of a green leaf sticking out of the top slot. Stylized hand-painted game prop with soft PBR materials.
```

### 12 · 도토 리깅용 — `doto-rigged.glb`

- 기본 이미지: `assets/models/source/12-doto-apose.png` (팔 벌린 A자세, 정면)
- 목표 18,000 · 대칭 켬
- 만든 뒤: 메시 **자동 리깅(Rigging)** → 애니메이션은 대기(Idle)·손 흔들기(Wave) 두 개면 충분. 함께 GLB로 내보내기
- 확인할 것: 꼬리가 몸과 붙어 뭉개지지 않았는지, 목도리 잎 핀

텍스처 프롬프트
```
Cute stylized chipmunk mascot from an animated film: soft orange-brown fur with dark stripes on the back and face, cream belly and muzzle, big glossy brown eyes, pink nose, large fluffy bushy tail with a cream underside, green cloth scarf with a small brass leaf pin. Soft fur-like painted texture, friendly and clean.
```

다시 그리기 프롬프트 (힉스필드 · 참고 이미지 `assets/field/source/doto-20261022.png`)
```
The same chipmunk mascot character as the reference: big glossy brown eyes, orange-brown fur with dark stripes on the back and face, cream belly and muzzle, a green scarf with a small leaf pin, and a large bushy tail. Full body, standing upright on the hind legs in a neutral A-pose for 3D rigging: arms held slightly away from the body at about 30 degrees with open empty paws (no acorn), legs slightly apart with both feet flat, facing straight toward the viewer (front view), the tail raised behind and slightly to the side so it does not cover the arms or body, gentle closed-mouth smile. Stylized 3D animated-film look matching the reference, soft even lighting, no cast shadow, no ground, no text, transparent background, entire character fully visible with margin. Reference image for image-to-3D model creation and auto-rigging.
```

### 13 · 강낭콩 싹 (선택) — `bean-seedling.glb`

- 기본 이미지: `assets/models/source/13-bean-seedling.png`
- 목표 10,000 · 대칭 끔
- 확인할 것: 떡잎 2장, 본잎 2장, 곧은 뿌리와 곁뿌리

텍스처 프롬프트
```
Young kidney bean seedling: two plump pale green cotyledons, two heart-shaped true leaves with fine veins, smooth light green stem turning cream near the root, white taproot with thin side roots. Soft realistic botanical illustration look, matte materials.
```

### 14 · 도토 원래 자세 — `doto-static.glb`

- 기본 이미지: `assets/models/source/14-doto-original.png` (도토리를 든 3/4 자세)
- 목표 18,000 · 대칭 끔
- 리깅 없이 둥실 떠오르기·흔들기만 코드로 줄 때 사용. 12를 만들면 안 만들어도 된다
- 텍스처 프롬프트는 12와 같고, 끝에 `holding a small acorn with both paws.` 를 붙인다

---

## 5. 받아온 뒤

1. GLB를 `assets/models/`에 넣고 알려 줘. 이름은 3번 표의 GLB 이름.
2. 이쪽에서 할 일: 삼각형·용량 직접 세기 → 무손실 압축(형태 유지) → 텍스처 1024 재압축 → 같은 각도 전후 스크린샷 비교 → 게임 연결(확대창·보상창·엔딩) → 2D 대체 화면 확인 → 오프라인 캐시 포함.
3. 출처는 `assets/CREDITS.md`에 "Meshy 생성, 기본 이미지 출처"로 기록한다.
