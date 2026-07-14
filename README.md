# D-day Widget

윈도우 바탕화면에 항상 떠 있는 미니멀한 **D-day 카운트다운 위젯**입니다. Electron 기반이며, 창 테두리 없이 반투명하게 떠서 남은 날짜를 한눈에 보여줍니다.

## ✨ 주요 기능

- **항상 위에 표시 (Always-on-top)** — 다른 창 위에 계속 떠 있는 반투명 위젯
- **여러 개의 D-day 관리** — 라벨 + 날짜로 자유롭게 추가/수정/삭제
- **스마트 정렬** — 다가오는 일정이 가까운 순으로 위에, 지난 일정은 아래로 자동 정렬
- **D-Day / D±N 표시** — 당일은 `D-Day`, 미래는 `D-N`, 지난 날은 `D+N`
- **자정 자동 갱신** — 매일 0시에 남은 날짜를 다시 계산
- **투명도 조절** — 30%~100% 슬라이더로 배경에 자연스럽게 녹이기
- **트레이 상주** — 창을 닫아도 시스템 트레이에 상주, 클릭으로 보이기/숨기기
- **Windows 시작 시 자동 실행** — 설정에서 켜고 끌 수 있음 (최초 실행 시 기본 활성화)
- **위치·크기 기억** — 창을 옮기거나 크기를 바꾸면 자동 저장

## 🖼️ 사용법

1. 앱을 실행하면 화면에 위젯이 나타납니다.
2. 우측 상단 **`+`** 버튼으로 D-day를 추가합니다. (라벨 예: `수능`, 날짜 선택)
3. 목록의 항목을 클릭하면 **수정 / 삭제**할 수 있습니다.
4. **`⚙`** 버튼으로 투명도 · 자동 실행을 설정합니다.
5. **`×`** 버튼은 위젯을 숨깁니다. 완전 종료는 설정 패널의 **종료** 또는 트레이 메뉴에서.

> 데이터는 사용자 프로필의 `userData/data.json`에 로컬로 저장됩니다.

## 🚀 개발 · 실행

사전 요구사항: [Node.js](https://nodejs.org/)

```bash
# 의존성 설치
npm install

# 개발 모드로 실행
npm start
```

## 📦 빌드 (배포용 설치 파일)

`electron-builder`로 Windows용 NSIS 설치 파일을 만듭니다.

```bash
# 폴더 형태로만 패키징 (설치 파일 X, 빠른 확인용)
npm run pack

# NSIS 설치 파일 생성 → dist/ 에 출력
npm run dist
```

빌드 결과물은 `dist/` 폴더에 생성됩니다.

## 🗂️ 프로젝트 구조

```
dday-widget/
├── main.js         # Electron 메인 프로세스 (창, 트레이, 데이터 저장, 자동 실행)
├── preload.js      # 안전한 IPC 브릿지 (contextIsolation)
├── renderer.js     # UI 로직 (D-day 계산·정렬·렌더링)
├── index.html      # 위젯 마크업
├── styles.css      # 스타일
├── scripts/
│   └── generate-icon.js  # 트레이/앱 아이콘 생성
└── assets/
    └── icon.png    # 아이콘
```

## 🛠️ 기술 스택

- [Electron](https://www.electronjs.org/) ^33
- [electron-builder](https://www.electron.build/) ^25 (NSIS 패키징)
- Vanilla JavaScript / HTML / CSS

## 📄 라이선스

[MIT](LICENSE)
