# Naver RSS Landing (GitHub Pages)

네이버 블로그 최신 글을 RSS로 받아와서, 썸네일 카드 그리드로 보여주는 **랜딩 페이지**입니다.

- 블로그: https://blog.naver.com/dic-wannabe
- GitHub Pages에 올리면 누구나 접속 가능
- 최신 글은 RSS 기준으로 자동 업데이트

> ⚠️ 중요: GitHub Pages(정적 호스팅)에서는 브라우저가 네이버 RSS를 직접 fetch 하려고 하면 CORS로 막히는 경우가 많습니다.
> 그래서 Cloudflare Worker 같은 **프록시**를 하나 두고, 프론트는 그 프록시(/feed)에서 XML을 받아오는 방식으로 구성했습니다.

---

## 1) 파일 구성

- `index.html` : 단일 페이지 (랜딩)
- (선택) `worker.js` : Cloudflare Worker 예시 코드

---

## 2) Cloudflare Worker 배포 (프록시 만들기)

1. Cloudflare 가입 후 **Workers**로 이동
2. `Create Worker`
3. 아래 `worker.js` 코드를 복사해 붙여넣고 Deploy
4. 배포 후 URL이 예: `https://your-worker-name.your-subdomain.workers.dev`
5. 이 프로젝트의 `index.html`에서 `FEED_ENDPOINT`를 아래처럼 설정:

```js
const FEED_ENDPOINT = "https://your-worker-name.your-subdomain.workers.dev/feed";
```

---

## 3) GitHub Pages 배포

### 방법 A) GitHub 웹에서 업로드 (가장 쉬움)

1. GitHub에서 새 리포지토리 생성 (Public 권장)
2. `index.html` 파일을 리포지토리 루트에 업로드
3. 리포지토리 **Settings → Pages**
4. Source: `Deploy from a branch`
5. Branch: `main` / Folder: `/ (root)`
6. Save 후 생성된 URL로 접속

### 방법 B) 로컬에서 git으로 푸시

```bash
git init
git add .
git commit -m "init"
git branch -M main
git remote add origin https://github.com/<YOUR_ID>/<REPO>.git
git push -u origin main
```

그 다음 Settings → Pages에서 동일하게 설정합니다.

---

## 4) 커스터마이징

- 카드 개수: `slice(0, 9)` 숫자 변경
- 타이틀/설명: `index.html` 상단 텍스트 수정
- 디자인: CSS 수정

---

## Troubleshooting

- 카드가 안 뜨고 오류가 나면:
  - `FEED_ENDPOINT`가 정확한지 확인
  - Worker가 `/feed` 경로를 반환하는지 확인
  - Worker URL을 브라우저에서 직접 열었을 때 `{"xml":"..."} ` 형태로 오는지 확인
# wedding_hall_budget
