# 02 --- Performance and Data

## P0 성능 원칙

Drawing 때문에 기존 Obsidian Canvas의 Pan, Zoom, Card 선택/이동,
Multi-selection, Group 이동, 저장, 대형 Canvas 탐색 성능이 눈에 띄게
저하되지 않아야 한다.

## Canvas Node와 Drawing 분리

Drawing 복잡도를 기존 Canvas Node 수 증가와 직접 연결하지 않는다.

**금지:** `Stroke 1개 = Canvas Node 1개`

Stroke가 수천\~수만 개가 되어도 Canvas Node 수가 동일하게 폭증하는
구조를 사용하지 않는다.

## 대형 Drawing 전제

장시간 Drawing으로 Stroke와 Layer가 대량 증가하는 상황을 정상 사용
사례로 본다.

-   전체 Drawing Data는 보존
-   Viewport 주변을 우선 렌더링
-   화면 밖 Drawing의 불필요 렌더링 최소화
-   Zoom Out 시 LOD 적용
-   Zoom In 시 원래 품질 복구
-   Pan/Zoom 때 전체 Drawing 재생성 금지
-   숨김 Layer의 불필요 렌더링 최소화
-   Layer Thumbnail은 필요한 시점 중심으로 갱신

LOD와 Culling은 표시 최적화일 뿐 원본 데이터를 변경하지 않는다.

## 저장

Pointer Move마다 디스크 저장하지 않는다.

`Drawing Input → 메모리 즉시 반영 → 변경사항 축적 → Batch Auto-save`

Canvas 전환/닫기, Obsidian 종료 등 필요한 시점에는 남은 변경사항을
저장한다. 저장 작업이 실시간 Drawing을 방해해서는 안 된다.

## Drawing Data 분리

대량 Drawing Data를 기존 `.canvas`에 직접 누적하는 것을 기본 구조로
사용하지 않는다.

`.canvas ↔ Drawing Data`

Drawing Data에는 Layer/Group/Brush Drawing/Shape/Text/Layer 설정 등이
포함될 수 있다. 실제 포맷, 경로, 직렬화 방식은 기술 검증 후 결정한다.

## 생명주기

-   Canvas 복제 → Drawing Data도 복제, 복제본은 독립
-   Canvas 이름 변경/이동 → 기존 Drawing 연결 유지
-   Canvas 삭제 → 연결된 Drawing Data도 삭제
-   플러그인 자체 Orphan 보존 기능은 두지 않음

파일 경로 변경만으로 연결이 끊겨서는 안 된다. 구체적인 식별 기술은 Codex
검증 영역이다.

## 구현 기술 경계

렌더링 라이브러리, 캐시, Worker, 공간 인덱싱, 직렬화 포맷 등은 기획에서
임의 확정하지 않는다. 대신 대형 Canvas 대응, 전체 재계산 방지, Canvas
Node 폭증 방지, 저장/Thumbnail 작업의 입력 방해 방지를 요구한다.
