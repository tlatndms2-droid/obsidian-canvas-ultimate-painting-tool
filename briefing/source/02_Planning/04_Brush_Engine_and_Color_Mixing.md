# 04 --- Brush Engine and Color Mixing Targets

## 상태

이 문서는 기존 Drawing UX 이후 추가 확정된 Brush Engine 목표를 보충한다.
세부 알고리즘은 Codex가 실제 환경에서 검증한다.

## Brush Settings 기본 골격 --- 확정

1.  Brush Size
2.  Ink
3.  Color Mixing
4.  Brush Tip
5.  Stroke
6.  Stabilization
7.  Texture
8.  Spray / Scatter
9.  Dynamics

모든 CSP Parameter를 그대로 구현한다는 뜻은 아니다. CSP의 검증된 Drawing
UX를 Reference로 사용하되 Obsidian에서 실제 구현 가능한 범위로 결정한다.

## Brush Size Dynamics --- 확정

-   기본 Size
-   Slider
-   숫자 직접 입력
-   `Ctrl + Alt + 좌우 드래그`
-   Minimum Size
-   Pressure Curve

## Ink / Opacity --- 방향 확정

Opacity는 Color Mixing의 Paint Amount/Density와 별개로 취급한다. Opacity
Dynamics도 Size와 유사한 구조를 목표로 한다.

## Color Mixing --- 핵심 제품 목표

사용자는 Color Mixing을 Drawing의 핵심 기능으로 본다.

단순 Opacity 누적이 아니라 기존 Drawing 색과 현재 Brush 색이
Painting처럼 상호작용하는 Mixing System을 목표로 한다.

기획 후보: - Color Mixing ON/OFF - Mixing Type - Amount of Paint -
Density of Paint - Color Stretch - Mixing Algorithm - Brightness
Correction - Mixing 관련 Dynamics

## Dynamics 방향

공통 Input이 여러 Brush Parameter에 연결되는 구조를 목표로 한다.

예: - Pressure → Size - Pressure → Opacity - Pressure → Amount of
Paint - Pressure → Density of Paint

## 기술 검증

CSP와 동일한 내부 Mixing Algorithm을 보장하지 않는다.

Codex가 검증: - Drawing/Brush Rendering Engine - Canvas 2D / WebGL /
WebGPU 등 후보 - Perceptual Mixing 가능성 - Smear / Running Color 계열
가능성 - GPU/CPU 비용 - 대형 Canvas + Layer + Mixing 성능 - Dynamics
공통 시스템 - Texture / Scatter / Tilt / Rotation 지원 범위

필요하면 `Brush Mixing PoC`를 별도 Gate로 둔다.

## 역할 전환

이 문서 이후 Brush Engine, Color Mixing, Rendering의 세부 기획은 Codex가
실제 구현 가능성과 P0 성능을 근거로 결정한다.
