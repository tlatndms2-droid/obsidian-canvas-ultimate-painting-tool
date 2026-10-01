# HANDOFF --- Canvas Drawing Tool Bar

> **인계 목적:** 이 문서는 현재까지 GPT에서 확정한 제품 요구사항과 UX
> 기준선을 Codex에 넘기기 위한 최종 HANDOFF다.\
> **단계 전환:** 이후 남은 세부 기획은 Codex가 실제 Obsidian 환경, API,
> 렌더링 구조, 성능을 조사·검증하면서 결정한다.

------------------------------------------------------------------------

# 0. Codex에게 가장 먼저 전달할 지시

## 역할 전환

이 시점부터 Codex는 단순 구현자가 아니라 **기술 검증을 동반한 후속
기획 + 구현 담당자**다.

현재 문서에 적힌 확정 요구사항을 임의로 변경하지 않는다.

다만 다음 영역은 구현 기술과 강하게 결합되어 있으므로 Codex가 실제
환경을 조사한 뒤 세부 기획을 결정한다.

-   Drawing Engine 내부 구조
-   렌더링 기술
-   Brush Engine 세부 구조
-   Color Mixing 구현 방식
-   Brush Dynamics 최종 범위
-   Photoshop Brush 호환 범위
-   Blend Mode 지원 범위
-   Canvas와 Drawing History 통합
-   저장 포맷과 식별 방식
-   성능 최적화 구현

## 개발 원칙

기술적으로 불가능하거나 P0 성능 원칙과 충돌하는 요구사항을 발견하면:

`임의 대체 구현`을 하지 말고

1.  무엇이 문제인지
2.  실제 검증 결과
3.  기존 요구사항에 미치는 영향
4.  가능한 대안
5.  추천안

을 먼저 보고한다.

------------------------------------------------------------------------

# 1. 프로젝트 최상위 원칙 --- 변경 금지

## 1. Obsidian Canvas 자체가 그림판이다

별도의 Drawing Canvas / Drawing Area를 만들지 않는다.

기존 Obsidian Canvas의 Card / Image / Group 등과 Drawing이 같은 무한
Canvas 공간에 공존한다.

`Canvas 열기 → Drawing Tool 선택 → 원하는 위치에서 바로 Drawing`

## 2. Clip Studio Paint에 가까운 Drawing 경험

단순 Annotation Plugin이 아니라 실제 Drawing 작업이 가능한 시스템을
목표로 한다.

CSP는 Brush / Layer / Selection / Color Mixing 등의 주요 UX Reference다.

CSP를 그대로 복제하는 것이 목적은 아니며, Obsidian Canvas 환경에서 실제
구현 가능한 구조로 재설계한다.

## 3. 성능은 P0

Drawing 때문에 기존 Canvas의 다음 성능을 눈에 띄게 희생해서는 안 된다.

-   Pan
-   Zoom
-   Card 선택/이동
-   Multi-selection
-   Group 이동
-   저장
-   대형 Canvas 탐색

기능과 성능이 충돌하면 성능을 우선한다.

------------------------------------------------------------------------

# 2. 현재 프로젝트 상태

**상태:** 제품/UX 기획 완료 구간 → 기술 검증/후속 기획/구현 단계로 전환

**본 개발 전 P0 Gate:** Canvas Integration PoC

현재까지 확정된 주요 영역:

-   Canvas/Drawing 관계
-   기본 입력
-   Drawing Toolbar 위치
-   Brush Preset Panel 위치와 기본 역할
-   Brush 기본 요구사항
-   Eraser
-   Color
-   Shape
-   Text
-   Layer
-   Selection/Transform
-   Clipboard
-   Undo/Redo 목표
-   Drawing Data 정책
-   성능 P0 원칙
-   Canvas Integration PoC 범위

------------------------------------------------------------------------

# 3. 기본 Canvas 조작 --- 확정

  입력                         동작
  ---------------------------- -------------------------------
  좌클릭 / 펜 드래그           현재 Drawing Tool 실행
  `Space + 좌클릭 드래그`      임시 Canvas Pan
  휠 클릭 + 드래그             Canvas Pan
  휠                           Canvas Zoom
  `Ctrl + Z`                   Undo
  `Ctrl + Shift + Z`           Redo
  `Ctrl + Alt + 좌우 드래그`   Brush / Eraser 크기 연속 조절

Space를 놓으면 기존 Drawing Tool 상태를 유지한다.

Drawing Tool 사용 중 Card 위에 입력해도 Card가 선택되거나 이동하지
않는다.

Selection Tool에서는 기존 Obsidian Canvas 조작으로 복귀한다.

Drawing은 Canvas 좌표에 종속되어 Pan/Zoom 후에도 Card/Image와 상대
위치를 유지한다.

Drawing은 Card/Image 위에도 표시할 수 있다.

------------------------------------------------------------------------

# 4. UI --- 확정 기준선

## Drawing Toolbar

-   Canvas 좌측
-   세로형

현재 범위:

-   Selection
-   Brush
-   Eraser
-   Shape
-   Text
-   Color
-   Eyedropper
-   Undo
-   Redo

## Brush Preset Panel

-   Brush 버튼과 연결
-   Toolbar 오른쪽에 표시

기본 역할:

-   Brush Group
-   Stroke Preview
-   Brush Name
-   선택 Preset Highlight
-   Brush 추가
-   Group 추가
-   삭제
-   Brush Settings 접근
-   Preset 순서 변경
-   Group 간 이동
-   Group 생성/삭제/이름 변경
-   Group 접기/펼치기

Photoshop Import Brush도 동일한 Preset System에서 관리한다.

## Layer Panel

-   Canvas 우측
-   Photoshop/CSP식 Layer Workflow 참고

각 Layer에 최소한:

-   Visibility
-   실제 Drawing Thumbnail
-   Layer Name
-   Lock
-   선택 Highlight
-   Opacity

UI를 변경할 필요가 생기면 기존 확정 위치를 임의로 바꾸지 말고 변경
이유를 먼저 보고한다.

------------------------------------------------------------------------

# 5. Brush --- 확정 요구사항

## 기본

-   Brush 사용 중 Card 선택 차단
-   Brush Cursor에 실제 Brush 크기/형태를 가능한 범위에서 반영
-   `Ctrl + Alt + 좌우 드래그`로 크기 조절
-   조절 중 실제 직경 실시간 표시
-   Stabilization은 Brush Preset별 독립 저장

## Pressure

최소 요구:

-   Size Pressure: ON/OFF + 영향 강도
-   Opacity Pressure: ON/OFF + 영향 강도

Brush Size Dynamics 방향:

-   기본 Size
-   숫자 입력
-   Slider
-   Minimum Size
-   Pressure Curve

Opacity도 동일 계열 Dynamics 구조를 목표로 한다.

## Brush Engine

CSP식 고급 Brush Engine을 목표로 한다.

후보 영역:

-   Brush Size
-   Ink
-   Color Mixing
-   Brush Tip
-   Stroke
-   Stabilization
-   Texture
-   Spray / Scatter
-   Dynamics

**중요:** 위 세부 Parameter를 모두 그대로 구현하라고 확정한 것이 아니다.

Codex가 실제 렌더링 구조와 성능을 검토한 뒤 최종 지원 범위를 기획한다.

------------------------------------------------------------------------

# 6. Color Mixing --- 핵심 목표

사용자는 Color Mixing을 **실제 Drawing의 핵심 기능**으로 본다.

따라서 단순 Opacity 누적 수준이 아니라 기존 Drawing 색과 현재 Brush 색이
Painting처럼 상호작용하는 Mixing System을 목표로 한다.

기획 목표 후보:

-   Color Mixing ON/OFF
-   Mixing Type
-   Amount of Paint
-   Density of Paint
-   Color Stretch
-   Mixing Algorithm
-   Brightness Correction
-   Mixing 관련 Dynamics

특히 Dynamics는 향후 다음과 같은 연결을 고려한다.

-   Pressure → Size
-   Pressure → Opacity
-   Pressure → Amount of Paint
-   Pressure → Density of Paint

## 중요

**CSP와 동일한 내부 Mixing Algorithm을 구현한다고 확정하지 않는다.**

Codex가 다음을 조사/검증한다.

-   Obsidian/Electron 환경에서 현실적인 Mixing Engine
-   Canvas 2D / WebGL / WebGPU 등 후보
-   Perceptual Mixing 구현 가능성
-   Smear / Running Color 계열 구현 가능성
-   GPU/CPU 비용
-   대형 Canvas + Layer + Mixing 동시 성능
-   CSP에 가까운 필감과 P0 성능의 균형

필요하면 `Brush Mixing PoC`를 별도 Gate로 둔다.

------------------------------------------------------------------------

# 7. Photoshop Brush Import --- 목표 + 기술 검증

목표:

`Photoshop Brush → Import → 지원 가능한 속성 분석 → 자체 Brush Parameter로 변환 → 일반 Preset으로 사용`

Photoshop Brush 지원 자체는 제품 목표다.

그러나:

-   완전 호환
-   모든 Parameter 변환
-   CSP와 동일한 결과

는 확정하지 않았다.

Codex가 실제 포맷과 구현 가능 범위를 조사하여 지원 수준을 결정한다.

------------------------------------------------------------------------

# 8. Eraser --- 확정

-   픽셀/부분 삭제 방식
-   Stroke 전체 삭제 방식 아님
-   현재 선택 Layer에만 작동
-   잠긴 Layer에는 작동하지 않음
-   Brush와 동일한 크기 조절 UX

------------------------------------------------------------------------

# 9. Color --- 확정 목표

-   Color Circle
-   Eyedropper

Eyedropper는 Drawing뿐 아니라 현재 Canvas에 보이는 Image/Card 등 **화면
결과 전체에서 색을 추출**하는 것을 목표로 한다.

구체적인 화면 샘플링 방식은 Codex 기술 검증 대상이다.

------------------------------------------------------------------------

# 10. Shape --- 확정

지원:

-   직선
-   사각형
-   원
-   타원
-   직선 화살표

정책:

-   Fill 없음
-   외곽선만 사용
-   생성 후 객체 상태 유지

Selection으로:

-   이동
-   크기 변경
-   선 굵기 변경
-   색상 변경

직선/화살표는 시작점과 끝점을 다시 조절할 수 있어야 한다.

------------------------------------------------------------------------

# 11. Text --- 확정

Canvas 위치 클릭으로 생성.

생성 후:

-   이동
-   내용 수정
-   글자 크기 변경
-   색상 변경

현재 선택 Layer에 생성한다.

------------------------------------------------------------------------

# 12. Layer System --- 확정 요구사항

Layer가 없을 때 최초 Drawing 입력:

`Layer 1 자동 생성 → 자동 선택 → Drawing`

지원:

-   생성
-   삭제
-   이름 변경
-   실제 Drawing Thumbnail
-   Visibility
-   Lock
-   Opacity 0\~100%
-   Drag 순서 변경
-   Layer Group
-   Group 접기/펼치기
-   Group 표시/숨김
-   Layer Merge
-   Blend Mode

정책:

-   위 Layer일수록 Canvas에서도 위에 표시
-   Brush/Eraser는 현재 선택 Layer에 작동
-   Lock Layer 편집 차단
-   Layer 삭제/Merge는 Undo 가능
-   **Layer Duplicate 제외**

Blend Mode 최종 지원 목록은 Codex가 렌더링 기술/성능 검증 후 결정한다.

Thumbnail은 실제 Layer Drawing의 축소 Preview를 목표로 하되 성능을
우선한다.

------------------------------------------------------------------------

# 13. Selection / Transform --- 확정

Brush Drawing은 **개별 Stroke가 아니라 영역 단위 선택**을 기본으로 한다.

지원:

-   Rectangle Selection
-   Lasso Selection

기본적으로 현재 선택 Layer를 대상으로 한다.

선택 후:

-   이동
-   확대/축소
-   회전
-   좌우 반전
-   상하 반전
-   삭제

영역 밖 Canvas 클릭 → 선택 해제

`Delete` → 선택된 Drawing 부분만 삭제

## Clipboard

-   `Ctrl + C`: Copy
-   `Ctrl + X`: Cut
-   `Ctrl + V`: Paste

Paste 결과는 현재 Layer에 들어가며 즉시 선택 상태가 된다.

별도 Drawing Duplicate 명령은 두지 않는다.

------------------------------------------------------------------------

# 14. Undo / Redo --- 목표

Drawing 내부에서는 시간순 단일 History를 목표로 한다.

예:

`Stroke → Erase → Shape 수정 → Text 수정 → Layer 작업 → Merge`

`Ctrl + Z / Ctrl + Shift + Z`

기존 Obsidian Canvas History와 Drawing History를 완전히 통합할 수
있는지는 Codex가 검증한다.

------------------------------------------------------------------------

# 15. P0 Performance --- 변경 금지 요구사항

## Drawing과 Canvas Node 분리

금지:

`Stroke 1개 = Canvas Node 1개`

Drawing이 수천\~수만 Stroke로 증가해도 Canvas Node 수가 동일하게
폭증하는 구조를 사용하지 않는다.

## 대형 Drawing

목표:

-   전체 Drawing Data 보존
-   Viewport 주변 우선 렌더링
-   화면 밖 Drawing 렌더링 최소화
-   Zoom Out 시 LOD
-   Zoom In 시 원래 품질 복구
-   Pan/Zoom 시 전체 Drawing 재생성 방지
-   숨김 Layer 불필요 렌더링 최소화
-   Thumbnail 필요한 시점 중심 갱신

구체적인 Culling/LOD/Cache 기술은 Codex가 결정한다.

------------------------------------------------------------------------

# 16. 저장 / Drawing Data --- 확정 요구사항

Pointer Move마다 디스크 저장하지 않는다.

목표:

`Drawing Input → 메모리 즉시 반영 → 변경 축적 → Batch Auto-save`

Canvas 전환/닫기/Obsidian 종료 등 필요한 시점에는 남은 변경사항을
저장한다.

대량 Drawing Data를 기존 `.canvas` 내부에 직접 누적하는 것을 기본 구조로
사용하지 않는다.

개념:

`.canvas ↔ 별도 Drawing Data`

Drawing Data 후보:

-   Layer / Group
-   Brush Drawing
-   Shape
-   Text
-   Layer Settings
-   기타 Drawing 상태

실제 파일 포맷/경로/직렬화 방식은 Codex가 결정한다.

## 생명주기

-   Canvas 복제 → Drawing Data도 독립 복제
-   Canvas 이름 변경/이동 → Drawing 연결 유지
-   Canvas 삭제 → Drawing Data도 삭제
-   별도 Orphan 보존 기능 없음

단순 파일 경로 변경만으로 Drawing 연결이 끊겨서는 안 된다.

------------------------------------------------------------------------

# 17. P0 Canvas Integration PoC

**본 개발 전에 우선 수행한다.**

검증:

-   [ ] Obsidian Canvas 전체에서 Drawing 가능
-   [ ] Drawing과 Canvas Node 분리
-   [ ] Drawing Canvas 좌표 유지
-   [ ] Pan 동기화
-   [ ] Zoom 동기화
-   [ ] Card 위 Drawing
-   [ ] Drawing Tool에서 Card 입력 차단
-   [ ] Selection Tool에서 기존 Canvas 조작 복귀
-   [ ] 저장
-   [ ] Canvas 종료/재실행 후 Drawing 복원
-   [ ] 대형 Canvas 기본 Pan/Zoom/Input 성능

## Gate

PoC PASS → 본격적인 Drawing Engine / 후속 기획 진행

PoC FAIL → Brush Engine 개발로 넘어가지 말고 Canvas Integration 구조
재설계

------------------------------------------------------------------------

# 18. Codex가 이어서 결정할 영역

다음은 GPT 단계에서 더 이상 억지로 확정하지 않는다.

Codex가 조사 + PoC + 구현 근거를 가지고 결정한다.

1.  Drawing 렌더링 엔진
2.  Brush Engine 내부 모델
3.  Brush Settings 최종 Parameter
4.  Color Mixing Algorithm
5.  Mixing Quality와 성능 단계
6.  Brush Dynamics 공통 시스템
7.  Texture / Scatter / Tilt / Rotation 지원 범위
8.  Blend Mode 목록
9.  Photoshop Brush 호환 범위
10. Eyedropper 화면 샘플링 방식
11. Drawing History와 Canvas History 통합
12. Drawing Data 포맷
13. Canvas ↔ Drawing 식별 방식
14. Viewport Culling / LOD / Cache
15. Worker/GPU 활용 여부
16. Brush Mixing PoC 필요 여부

------------------------------------------------------------------------

# 19. 명시적 제외

-   별도 Drawing Canvas / Drawing Area
-   `Stroke = Canvas Node` 구조
-   Layer Duplicate
-   별도 Drawing Duplicate 명령
-   Shape Fill
-   Brush Drawing 개별 Stroke 선택을 기본 선택 방식으로 사용
-   플러그인 자체 Orphan Drawing 보존

------------------------------------------------------------------------

# 20. Codex 시작 순서

## Phase 1 --- 현재 프로젝트/Obsidian 환경 조사

현재 Obsidian Canvas와 Plugin 환경을 확인한다.

## Phase 2 --- Canvas Integration PoC 설계

최소 구현으로 P0 Gate를 검증한다.

## Phase 3 --- PoC 실행 및 측정

좌표 / 입력 / Pan / Zoom / Card 충돌 / 저장 / 복원 / 성능을 실제
환경에서 검증한다.

## Phase 4 --- 결과 보고

각 항목을:

-   PASS
-   FAIL
-   PARTIAL
-   추가 검증 필요

로 기록한다.

## Phase 5 --- 후속 기획

PoC 결과를 근거로 Drawing Engine과 Brush Engine의 실제 구조를 결정한다.

## Phase 6 --- 본 개발

검증된 구조를 기준으로 기능을 단계적으로 구현한다.

------------------------------------------------------------------------

# 21. Source

반드시 함께 참고:

-   `PROJECT_INSTRUCTIONS.md`
-   `01_Product_Principles.md`
-   `02_Performance_and_Data.md`
-   `03_Drawing_UX.md`
-   `04_UI_Mockup_Rules.md`

본 HANDOFF는 현재 상태를 빠르게 파악하기 위한 인계 문서다.

상세 요구사항 충돌 시 Source의 확정사항을 확인하고, 그래도 충돌이 남으면
임의 결정하지 말고 사용자에게 보고한다.

------------------------------------------------------------------------

# 22. Codex에게 전달할 시작 명령

아래 지시로 시작한다.

> `HANDOFF.md`와 프로젝트 Source 문서를 먼저 읽어라. 현재 확정된 제품/UX
> 요구사항을 변경하지 말고, 먼저 Obsidian Canvas 환경과 기존 프로젝트
> 구조를 조사한 뒤 `Canvas Integration PoC` 계획을 작성하라.\
> 남은 Brush Engine, Color Mixing, 렌더링, 저장 등의 세부 기획은 실제
> 구현 가능성과 P0 성능을 조사하면서 결정한다.\
> 기술적으로 불가능하거나 기존 요구사항과 충돌하는 부분을 발견하면
> 임의로 대체하지 말고 검증 근거, 영향, 가능한 대안과 추천안을 먼저
> 보고하라.\
> PoC 계획을 사용자에게 브리핑한 뒤 승인받고 구현을 시작하라.
