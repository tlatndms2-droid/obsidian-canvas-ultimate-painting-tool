# CSP 동작 참고 원칙

2026-09-27 사용자 요청: 그림 도구의 자잘한 동작을 매번 묻지 말고 Clip Studio Paint(CSP)를 최대한 참고한다. 이 문서는 **참고 기본값**을 기록한다. 기존 사용자 결정, Obsidian Canvas 카드 조작, Windows 우선 범위와 충돌하면 기존 결정이 우선이다. CSP의 전체 기능·파일 호환·시각 결과를 동일하게 제공한다는 확정은 아니다.

| 영역 | CSP 공식 설명에서 확인한 흐름 | 이 기획의 참고 기본값 | 상태 |
| --- | --- | --- | --- |
| 색 혼합 | 색 혼합을 켠 붓은 선택한 그리기 색을 더하면서 이미 그려진 색을 섞는다. Amount of paint, Density of paint, Color stretch가 결과를 조절한다. | 닿은 자리의 색 혼합 결과가 다음 선의 기본 붓 색을 자동으로 바꾸지는 않는다. 색을 명시적으로 고르거나 스포이드로 선택할 때 붓 색을 바꾼다. 색 혼합 범위는 **사용자 결정대로 현재 레이어만/보이는 그림 레이어 참조**, 기본은 현재 레이어만. | 앞 문장의 세부 동작은 CSP 흐름에서 도출한 참고 기본값. 혼합 범위는 사용자 확정. |
| 브러시 설정 유지 | 설정을 바꾸면 다음에 그 도구를 쓸 때 변경값이 유지된다. `기본값으로 저장`은 별도 명령이며, 잠긴 도구는 다음 선택 때 잠갔던 값으로 돌아간다. | 같은 Vault에서 현재 조절값을 다시 쓸 수 있게 하고, 기본값 덮어쓰기/초기화는 구분하는 방향으로 설계한다. 재시작 이후 유지 범위와 잠금 UI는 아직 확정하지 않는다. | CSP 공식 동작에서 가져온 참고안. 사용자의 확정 답변은 아님. |
| 영역 선택 | 선택 영역 아래에 작업 막대가 나타나 삭제·복사·변형 등에 접근한다. 변형 중 조절점과 뒤집기 명령을 사용할 수 있다. | 선택한 그림에는 조절점과 선택 작업 막대를 표시한다. **사용자 결정대로** 선택 직후 안쪽 끌기로 이동, 모서리 끌기로 크기 조절. 카드 선택과 그림 선택은 분리한다. | 선택·변형 동작은 사용자 확정이 CSP 참고보다 우선. |
| 레이어 | 선택한 레이어에 그리며 표시·잠금·불투명도·혼합 모드를 레이어 목록에서 조절한다. | 현재 그림 레이어에 그린다. 잠긴 레이어는 그리거나 편집하지 못한다. 두 레이어는 독립 내용을 유지하고 화면에서 겹쳐 보인다. Canvas 카드는 그림 레이어 목록 밖에 둔다. | 기존 기획 및 CSP 참고. |
| Photoshop 브러시 | CSP는 `.abr`을 도구로 가져오고, 여러 브러시가 담긴 ABR을 새 도구 그룹으로 추가한다. | 지원 가능한 ABR 팁과 설정을 일반 프리셋으로 변환해 같은 프리셋 패널에서 사용한다. 여러 개가 담긴 파일은 출처를 알아볼 수 있도록 그룹으로 정리하는 것을 기본 후보로 둔다. 지원하지 못하는 속성은 가져오기 결과에서 구분해 보여준다. 같은 Vault의 다른 Canvas에서 프리셋을 재사용한다. | 가져오기와 프리셋 사용은 기존 기획. 그룹 배치는 참고 기본값, 같은 Vault의 공유는 사용자 확정. 전체 ABR 호환 확정 아님. |

참고 자료: [CSP 색 혼합 붓](https://help.clip-studio.com/en-us/manual_en/240_brushes/Blending_tools.htm), [브러시 설정 유지·잠금·기본값 저장](https://help.clip-studio.com/en-us/manual_en/150_tools/How_to_use_tools.htm), [그리기 색과 색 선택](https://help.clip-studio.com/en-us/manual_en/240_brushes/Drawing_and_painting.htm), [스포이드가 현재 색을 바꾸는 동작](https://help.clip-studio.com/en-us/manual_en/300_color/Color_Mixing_palette.htm), [선택 작업 막대](https://help.clip-studio.com/en-us/manual_en/330_selection/Selection_Launcher.htm), [변형 조작](https://help.clip-studio.com/en-us/manual_en/360_transform/Transform_using_the_Tool_Property_palette.htm), [레이어 패널](https://help.clip-studio.com/en-us/manual_en/180_layers/Using_layers.htm), [ABR 가져오기](https://help.clip-studio.com/en-us/manual_en/240_brushes/Adding_new_brushes.htm).

다음 기획에서는 위 같은 작은 조작은 이 기본값으로 채운다. 데이터 삭제·복구, 화면의 핵심 배치, 다른 플랫폼 지원, 중요한 범위 증가처럼 결과가 크게 달라지는 내용만 사용자에게 묻는다. 공식 문서에서 확인되지 않은 CSP 동작은 추정으로 표시한다.
