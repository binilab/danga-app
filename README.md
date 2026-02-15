# DANGA (danga.site)

패션 평가 커뮤니티 **DANGA**의 프론트엔드 프로젝트입니다.  
슬로건: **단번에 가자 (나이스 패션이다)**

## 프로젝트 소개
- 코디를 올리고, 투표와 댓글로 빠르게 평가받는 커뮤니티를 목표로 합니다.
- 현재는 Auth + R2 업로드 + posts 작성/피드 조회(Part 5)까지 구현되어 있습니다.

## 기술 스택
- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Supabase (Auth + Postgres)
- Cloudflare R2 (S3 호환 API)

## 구현 상태
### Part 1~4
- 기본 라우트/랜딩 UI/헤더 로그인 상태
- Supabase OAuth 로그인 (Google/Kakao UI)
- R2 이미지 업로드 API + 업로더 UI

### Part 5 posts (현재)
- Supabase migration 형태로 `posts` 테이블/RLS/인덱스 구성
  - `supabase/migrations/20260216_create_posts.sql`
- `/post/new`
  - 이미지 업로드 후 캡션 입력
  - `POST /api/posts`로 게시글 저장
  - 성공 시 `/feed` 이동
- `/feed`
  - 최신순 조회 (`deleted_at is null`)
  - 20개 로딩 + `더보기` 버튼(page query)
- `/p/[id]`
  - posts 단건 조회 후 상세 표시

## 실행 방법
```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:3000` 접속 후 확인합니다.

## 환경 변수
### Supabase
```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

### Cloudflare R2
```env
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=...
R2_PUBLIC_BASE_URL=...
```

## 사전 설정
1. Supabase SQL Editor에서 아래 SQL을 순서대로 실행
   - `docs/sql/profiles.sql`
   - `docs/sql/posts.sql` (또는 migration 파일 내용)
2. Supabase Auth > Providers에서 Google 활성화 (Kakao는 선택)
3. Auth Redirect URL에 `/auth/callback` 경로 등록
4. Cloudflare R2 버킷과 Public Base URL 설정

## 폴더 구조
```text
app/
  admin/page.tsx
  api/posts/route.ts
  api/upload/route.ts
  auth/callback/route.ts
  feed/page.tsx
  me/page.tsx
  p/[id]/page.tsx
  post/new/page.tsx
  rank/page.tsx
  layout.tsx
  page.tsx
components/
  Header.tsx
  PageTitle.tsx
  PostCard.tsx
  auth/
    LoginModal.tsx
    ProfileMenu.tsx
  landing/
    CTA.tsx
    Hero.tsx
    HowItWorks.tsx
    RankPreview.tsx
    SampleGallery.tsx
  post/
    ImageUploader.tsx
    PostItemCard.tsx
lib/
  mock.ts
  posts.ts
  r2.ts
  supabase/
    client.ts
    server.ts
docs/
  sql/profiles.sql
  sql/posts.sql
  진행사항.md
supabase/
  migrations/20260216_create_posts.sql
```

## 주의 사항
- soft delete 정책으로 `posts.deleted_at` 컬럼을 사용합니다.
- 현재 단계에서는 **votes/comments 테이블은 아직 만들지 않습니다.**
- R2 Access Key/Secret은 서버 API에서만 사용하며 클라이언트에 노출되지 않습니다.
