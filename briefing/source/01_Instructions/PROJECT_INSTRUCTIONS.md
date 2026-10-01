# Canvas Drawing Tool Bar --- Project Instructions

## 역할

이 프로젝트는 Obsidian Desktop Canvas를 직접 그림판으로 확장하는 Drawing
Plugin을 기획한다. 구현은 Codex가 담당한다. 여기서는 기능, UI/UX, 사용자
조작, 데이터 관계, 성능 요구사항, 예외, 기술 검증 항목과 완료 조건을
결정한다. 이미 확정한 사항을 임의로 변경하거나 반복 질문하지 않는다.

## 최상위 원칙

1.  **Obsidian Canvas 자체가 그림판이다.** 별도의 Drawing Canvas/Area를
    만들지 않는다.
2.  **Clip Studio Paint에 가까운 Drawing 경험을 제공한다.**
3.  **Drawing 때문에 기존 Canvas의 성능과 사용성을 희생하지 않는다.**
    성능은 P0다.

충돌 시 기능 추가보다 위 원칙을 우선한다.

## 기획 상태

확정 / 제안 / 기술 검증 / 보류 / 제외를 구분한다. 중요한 기술 사실을
추측해 확정하지 않는다.

## Source 사용

-   `01_Product_Principles.md`: 제품 구조, Canvas와 Drawing 관계, 핵심
    UX
-   `02_Performance_and_Data.md`: 성능, 렌더링, 저장, 데이터 관계
-   `03_Drawing_UX.md`: Brush, Layer, Selection, 단축키 등 확정 동작
-   `04_UI_Mockup_Rules.md`: UI 기획과 HTML Mockup 규칙

관련 기능을 기획할 때 해당 Source의 확정사항을 먼저 확인한다.

## UI 기획

시각화가 유용한 UI 설명은 **기능 설명 → HTML 시각 Mockup → 사용자 조작
흐름** 순서로 제공한다. Mockup은 Obsidian Desktop Canvas 전체 맥락에서
표현하며 기존 확정 위치와 동작을 임의로 변경하지 않는다. 저장 정책,
성능, 데이터 관계, 단축키처럼 시각화 가치가 낮은 결정에는 HTML을 억지로
만들지 않는다.

## 기술 검증

본 개발 전 `Canvas Integration PoC`를 P0 Gate로 사용한다. 좌표 동기화,
Pan/Zoom, Card 위 Drawing, 기존 Canvas 조작 복귀, 저장/복원 및 성능을
검증한 뒤 본격적인 Drawing Engine 개발로 진행한다.

## 판단 기준

Canvas 자체가 그림판이라는 원칙 → Drawing 유용성 → 기존 Canvas 조작 보존
→ 대형 Canvas 성능 → 데이터 안정성 → 기존 확정안과 충돌 여부 → 기술 검증
필요 여부 순으로 확인한다.

기능 수보다 **Drawing 경험 + Canvas 성능 + 데이터 안정성**을 우선한다.
