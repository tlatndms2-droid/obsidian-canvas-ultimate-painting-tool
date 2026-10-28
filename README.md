# 옵시디언 드로잉 툴바

기존 **Canvas Drawing Tool Bar**의 새 이름입니다. 저장소 주소와 플러그인 ID는 유지하므로 기존 설정과 Canvas 그림을 그대로 이어서 사용합니다.

**1.0.20**부터 Canvas와 Markdown 필기를 본체 하나에 통합합니다. 별도 MD ZIP 설치가 필요하지 않습니다. 기존 MD 추가 기능의 필기 연결 정보는 보존하여 옮기고, 중복 실행을 막기 위해 기존 MD 추가 기능을 끕니다. [MD 사용 설명](markdown/README.md)을 참고하세요.

Obsidian Canvas에서 브러시·질감·도형으로 그리고 레이어와 실행 취소 기록을 관리하는 데스크톱 플러그인입니다.

**1.0.5**에서는 텍스트 기능을 독립 플러그인 [Canvas Text Tool](https://github.com/tlatndms2-droid/obsidian-canvas-text-tool) **0.1.0**으로 분리했습니다. 텍스트가 필요하면 BRAT에 `tlatndms2-droid/obsidian-canvas-text-tool`을 추가해 설치하세요. 기존 Canvas의 텍스트 내용은 유지됩니다.

## BRAT으로 설치

1. Obsidian 커뮤니티 플러그인에서 **BRAT**을 설치하고 켭니다.
2. BRAT의 **Add a beta plugin**에서 아래 저장소 주소를 입력합니다.

   `https://github.com/tlatndms2-droid/obsidian-canvas-ultimate-painting-tool`

3. 설치 후 커뮤니티 플러그인에서 **옵시디언 드로잉 툴바**를 켭니다.
4. Canvas를 열고 왼쪽 펜 아이콘을 누릅니다.

최소 Obsidian 버전: **1.12.7**. Windows/데스크톱용입니다. 최신 릴리스는 [Releases](https://github.com/tlatndms2-droid/obsidian-canvas-ultimate-painting-tool/releases)에서 확인할 수 있습니다.

## 주요 기능

- 브러시 프리셋, ABR 질감, 필압·기울기 설정과 지우개
- 색 혼합, 레이어·그룹, 선택 영역·변형·복사·붙여넣기
- 선·화살표·도형, 카드 이동에 연결된 그림
- 작업환경, 패널 조절, 우클릭 단축키 지정
- 우클릭 드래그로 화면 이동, Ctrl+우클릭 드래그로 확대·축소, Shift+우클릭 유지로 스포이트 사용
- 모든 브러시에 공통 각도 스냅: 15°·45°·75°·90°·직접 지정, 우클릭으로 켜기/끄기 단축키 지정
- Canvas별 Undo/Redo, 최대 횟수 설정, 기록 수·추정 메모리 표시와 비우기

[사용 안내](USER_GUIDE.md)

## 저장과 주의사항

그림은 Canvas에 연결된 별도 자료로 자동 저장됩니다. 작품을 백업할 때는 Canvas 파일만 복사하지 말고 연결된 Drawing 저장 자료를 포함한 Vault를 함께 보관하세요. 작업환경 내보내기는 작품 백업이 아닙니다.

대형 작품의 최초 열기는 반복 그리기보다 시간이 걸릴 수 있습니다. 실제 펜 장치와 외부 ABR 파일에 따라 결과가 다를 수 있습니다. 모바일은 지원하지 않습니다.

## 개발

Node.js에서 개발 의존성(esbuild)을 설치한 뒤 실행합니다.

```sh
node --test tests/*.test.cjs
node scripts/build.cjs
```

빌드 결과는 `dist/main.js`, `dist/manifest.json`, `dist/styles.css`입니다. 공개 릴리스에는 이 세 파일을 제공합니다.

1.0.0은 Gate 11 사용자 통과 승인 후 배포한 버전입니다. BRAT을 통한 실제 설치 확인은 사용자가 수행합니다.
