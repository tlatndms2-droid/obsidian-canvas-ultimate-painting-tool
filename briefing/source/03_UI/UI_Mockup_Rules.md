# 04 --- UI Mockup Rules

## HTML Mockup 우선

새 UI를 제안하거나 기존 UI의 구조·배치·상태·동작을 변경할 때 시각화가
유용하면 **HTML + CSS Mockup**을 함께 제공한다.

목적은 최종 디자인 확정이 아니라 사용자와 GPT가 동일한 UI를 상상하는지
빠르게 확인하는 것이다.

## 설명 순서

`기능 설명 → HTML 시각 Mockup → 사용자 조작 흐름`

클릭, 선택, 열기/닫기, Hover, Active, Tab, Drawer, Popup 등 인터랙션
설명에는 가능하면 JavaScript를 넣어 직접 조작 가능한 Mockup으로
표현한다.

## Obsidian 전체 맥락

UI 하나만 고립해서 보여주지 않는다. 가능한 경우 Obsidian Desktop Canvas
안에서 위치 관계를 함께 보여준다.

기본 관계:

`Obsidian Canvas → 좌측 Drawing Toolbar → Toolbar 옆 Context Panel → 중앙 전체 Canvas → 우측 Layer Panel`

**별도의 Drawing Surface를 만들지 않는다. Obsidian Canvas 자체가 Drawing
Surface다.**

## 확정 위치

-   Drawing Toolbar: Canvas 좌측, 세로형
-   Brush Preset Panel: Brush 버튼과 연결되어 Toolbar 오른쪽에 표시
-   Layer Panel: Canvas 우측

새 Mockup에서 임의로 위치를 바꾸지 않는다.

## Brush Preset Panel

현재 확정 요소: - Brush Group - Stroke Preview - Brush Name - 선택
Preset Highlight - Brush 추가 - Group 추가 - 삭제 - Brush Settings 접근

Photoshop Import Brush도 동일한 Panel에서 관리한다.

## Layer Panel

Photoshop/CSP식 Layer Workflow를 참고한다.

최소 표시: - Visibility - 실제 Drawing Thumbnail - Layer Name - Lock
상태 - 선택 Layer Highlight

Thumbnail은 단순 아이콘이 아니라 실제 Layer 내용의 축소 Preview를 목표로
하되 성능을 우선한다.

## 확정 상태 유지

이미 확정된 UI 위치, 기능, 명칭, 조작을 새 Mockup 때문에 임의 변경하지
않는다.

새 아이디어가 필요하면 **현재 확정안**과 **새 제안**을 명확히 구분한다.
사용자가 Mockup의 특정 부분을 수정하면 이후 기획에도 그 변경을 유지한다.

## HTML이 필요 없는 경우

시각적 가치가 낮은 다음 항목에는 HTML을 억지로 붙이지 않는다.

-   단축키
-   저장 정책
-   성능 요구사항
-   데이터 관계
-   기술 검증
-   Undo/Redo 정책
-   단순 ON/OFF 결정

UI의 형태·위치·상태·사용 흐름 이해에 시각화가 도움이 될 때 HTML을
사용한다.
