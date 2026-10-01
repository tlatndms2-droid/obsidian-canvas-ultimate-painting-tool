# 01 --- Product Principles

## 제품 정의

Canvas Drawing Tool Bar는 별도 Drawing 앱/영역을 만드는 플러그인이
아니다. **Obsidian Canvas 자체를 그림판으로 확장한다.** Card, Image,
Group, Edge와 Drawing이 같은 무한 Canvas 공간에 공존한다.

사용 흐름:
`Canvas 열기 → Drawing Tool 선택 → 원하는 위치에서 바로 Drawing`

## 기존 Canvas와 Drawing

**Selection Tool**은 기존 Canvas Card 선택, 이동, 크기 변경 등 원래
Canvas 조작을 담당한다.

**Drawing Tool**(Brush/Eraser/Shape/Text 등)은 Drawing 입력이 우선한다.
Card 위에서 그려도 아래 Card가 선택되거나 이동하지 않는다.

## Canvas 탐색

-   좌클릭/펜 드래그: 현재 Drawing Tool
-   `Space + 좌클릭 드래그`: 임시 Pan
-   휠 클릭 + 드래그: Pan
-   휠: Zoom
-   Space 해제: 기존 Drawing Tool 유지

## 좌표와 표시

Drawing은 화면 픽셀이 아니라 Canvas 좌표에 종속된다. Pan/Zoom 후에도
Card/Image와의 상대 위치를 유지한다. Drawing은 기존 Card/Image 위에도
표시할 수 있다.

## UX 기준

주요 참고 대상은 **Clip Studio Paint**다. 단순 Annotation이 아니라 실제
그림 작업이 가능한 수준을 목표로 하되 CSP 자체를 복제하지 않는다.

## P0 Canvas Integration PoC

본 개발 전에 다음을 검증한다.

Canvas 전체 Drawing → Canvas 좌표 유지 → Pan/Zoom 동기화 → Card 위
Drawing → Drawing Tool에서 Card 입력 차단 → Selection Tool에서 기존
Canvas 조작 복귀 → 저장/재실행 후 Drawing 복원 → 대형 Canvas 기본 성능
확인

PoC 실패 시 후속 기능보다 Canvas Integration 구조를 먼저 재설계한다.

## 개발 의존 흐름

`Canvas Integration PoC → Drawing Engine → Input System → Layer System → Selection/Transform → Brush Engine → Brush Preset → 고급 Brush → Photoshop Brush Import → 성능 안정화`

구체적인 구현 순서는 기술 검증 결과에 따라 조정할 수 있다.
