# 03 --- Drawing UX

## Toolbar와 입력

Drawing Toolbar는 Canvas 좌측 세로형이다.

현재 도구 범위: Selection / Brush / Eraser / Shape / Text / Color /
Eyedropper / Undo / Redo

-   좌클릭/펜 드래그: 현재 Drawing Tool
-   `Space + 좌클릭 드래그`: Pan
-   휠 클릭 + 드래그: Pan
-   휠: Zoom
-   `Ctrl + Z`: Undo
-   `Ctrl + Shift + Z`: Redo
-   `Ctrl + Alt + 좌우 드래그`: Brush/Eraser 크기 연속 조절

크기 조절 중 실제 직경을 실시간 커서로 표시한다.

## Brush

Brush 사용 중 Card는 선택되지 않는다. Brush Cursor는 가능한 경우
Size/Roundness/Angle/Tip 형태를 반영한다.

필압: - Size Pressure: ON/OFF + 영향 강도 - Opacity Pressure: ON/OFF +
영향 강도

Stabilization은 Brush Preset별로 독립 저장한다.

Brush Engine은 CSP식 구조를 목표로 하며 Size, Opacity, Minimum
Size/Opacity, Hardness, Spacing, Stabilization, Brush Tip, Angle,
Roundness, Flow, Texture, Scatter, Tilt, Rotation, 기타 Dynamics를
검토한다. 최종 범위는 기술 검증 후 확정한다.

## Brush Preset

Brush 버튼과 연결된 별도 Brush Preset Panel을 사용한다.

-   사용자 Group 생성/삭제/이름 변경
-   Group 접기/펼치기
-   Preset 순서 변경 및 Group 간 이동
-   Preset별 설정 저장
-   Stroke Preview + Brush Name
-   현재 Preset Highlight

Photoshop Import Brush도 같은 Preset 시스템에서 관리한다.

## Photoshop Brush Import

`Photoshop Brush → Import → 지원 속성 분석 → 자체 Brush Parameter 변환 → 일반 Preset으로 사용`

완전 호환은 사전 확정하지 않고 기술 검증한다.

## Eraser

픽셀/부분 삭제 방식이다. Stroke 전체 삭제 방식이 아니다. 현재 선택
Layer에만 작동하며 잠긴 Layer에는 작동하지 않는다. Brush와 같은 크기
조절 UX를 사용한다.

## Color

Color Circle과 Eyedropper를 제공한다. Eyedropper는 Drawing뿐 아니라
Canvas에 보이는 Image/Card 등 화면 결과 전체의 색상 샘플링을 목표로
한다. 구체적인 화면 샘플링 방식은 기술 검증한다.

## Shape

지원: 직선 / 사각형 / 원 / 타원 / 직선 화살표. Fill 없이 외곽선만
사용한다.

Shape는 생성 후 객체 상태를 유지하며 이동, 크기, 선 굵기, 색상 수정이
가능하다. 직선/화살표는 시작점과 끝점을 다시 조절할 수 있다.

## Text

Canvas 위치 클릭으로 생성한다. 생성 후 이동, 내용 수정, 글자 크기, 색상
변경이 가능하며 현재 Layer에 생성한다.

## Layer

Layer가 없을 때 최초 Drawing 입력 시 `Layer 1`을 자동 생성/선택한다.

기능: - 생성/삭제/이름 변경 - 실제 Drawing Thumbnail - Visibility -
Lock - Opacity 0\~100% - Drag 순서 변경 - Layer Group - Group
접기/펼치기 및 표시/숨김 - Layer Merge - Blend Mode

위 Layer일수록 Canvas에서 위에 표시한다. Layer Duplicate는 제외한다.
삭제와 Merge는 Undo 가능해야 한다. Blend Mode 최종 목록은 기술 검증 후
확정한다.

## Selection

Brush Drawing은 개별 Stroke가 아니라 **영역 단위**로 선택한다.

-   Rectangle Selection
-   Lasso Selection

기본적으로 현재 선택 Layer만 대상으로 한다. 선택 후 이동, 확대/축소,
회전, 좌우/상하 반전, 삭제가 가능하다. 영역 밖 Canvas 클릭으로 선택
해제한다. `Delete`는 선택된 Drawing 부분만 삭제한다.

## Clipboard

-   `Ctrl + C`: Copy
-   `Ctrl + X`: Cut
-   `Ctrl + V`: Paste

붙여넣기는 현재 Layer에 들어가고 즉시 선택 상태가 된다. 별도 Drawing
Duplicate 명령은 두지 않는다.

## Undo/Redo

Drawing 내부는 시간순 단일 History를 목표로 한다. Stroke, Erase,
Shape/Text 수정, Layer 작업, Merge 등을 순서대로 Undo/Redo한다. 기존
Obsidian Canvas History와의 완전 통합은 기술 검증 대상이다.
