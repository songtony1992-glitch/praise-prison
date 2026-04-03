# 칭찬 감옥

오늘 한 일을 입력하면 AI가 세상에서 가장 과장된 칭찬을 생성하고, 화면에 랜덤 애니메이션이 펼쳐지는 웹앱.

## 배포 URL

**https://praise-prison-app.onrender.com**

## 기술 스택

| 구분 | 내용 |
|------|------|
| 백엔드 | Node.js + Express |
| 프론트엔드 | Vanilla JS + Canvas API |
| AI | Groq API (qwen/qwen3-32b) |
| 이미지 처리 | sharp |
| 배포 | Render |

## 프로젝트 구조

```
PP/
├── server.js          # 백엔드 (Groq API 호출, OG 이미지 생성)
├── public/
│   ├── index.html     # 프론트엔드 (UI + 애니메이션)
│   └── thumb.png      # OG 썸네일 원본
├── .env               # 환경변수 (비공개)
├── .env.example       # 환경변수 예시
├── render.yaml        # Render 배포 설정
└── package.json
```

## 환경변수 설정

`.env.example`을 `.env`로 복사 후 키 입력:

```
GROQ_API_KEY=your_groq_api_key_here
PORT=3000
```

## 로컬 실행

```bash
npm install
npm start
# http://localhost:3000
```

## 주요 기능

- **AI 칭찬 생성**: Groq qwen3-32b 모델이 한국어로 과장된 칭찬 생성
- **4종 랜덤 애니메이션**: 불꽃놀이 / 색종이 / 번개 / 네온 버블
- **마크다운 렌더링**: AI 응답의 bold, italic 등 마크다운 적용
- **OG 이미지**: 카카오톡 공유 시 썸네일 노출
- **API 키 보안**: 키는 서버에서만 관리, 클라이언트에 미노출

## 배포 (Render)

GitHub 레포 연결 후 자동 배포. 환경변수 `GROQ_API_KEY` Render 대시보드에서 설정 필요.

## OG 이미지 캐시 갱신

이미지 교체 시 `index.html`의 OG 이미지 URL 버전 쿼리 증가:
```
og-image.png?v=3  →  og-image.png?v=4
```
