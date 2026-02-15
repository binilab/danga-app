# DANGA (danga.site)

패션 평가 커뮤니티 **DANGA**의 프론트엔드 프로젝트입니다.  
슬로건: **단번에 가자 (나이스 패션이다)**

## 프로젝트 소개
- 코디를 올리고, 투표와 댓글로 빠르게 평가받는 커뮤니티를 목표로 합니다.
- 현재는 Auth + R2 업로드 + posts + votes + 랭킹 + 마이페이지 고도화(Part 9)까지 구현되어 있습니다.

## 기술 스택
- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Supabase (Auth + Postgres)
- Cloudflare R2 (S3 호환 API)

## 구현 상태
### Part 1~7
- 기본 라우트/랜딩 UI/헤더 로그인 상태
- Supabase OAuth 로그인 (Google/Kakao UI)
- R2 이미지 업로드 API + 업로더 UI
- posts 작성/피드/상세
- votes 토글(optimistic UI)

### Part 8~10 (현재)
- `/rank` 주간/월간 탭 UI
- 선택 탭 기준 `weekly_post_rankings` / `monthly_post_rankings` 조회
- Top 50 (rank asc)
- ranking -> posts -> profiles 순으로 일괄 조회(in 쿼리)하여 N+1 방지
- 랭킹 카드 정보
  - rank number
  - badge pill
  - score
  - thumbnail
  - 작성자 nickname/avatar
- 카드 클릭 시 `/p/[id]` 이동
- (선택사항) `/feed` 및 `/p/[id]` 카드에 주간 뱃지 표시
- `/me` 마이페이지 탭
  - `내 글`(20개 + 더보기)
  - `내 좋아요`(최대 50개)
  - `내 댓글`(최대 50개)
- `/me` 프로필 편집
  - nickname 수정
  - avatar_url 텍스트 수정
- `/me` 계정 탈퇴(soft delete)
  - `profiles.deleted_at = now()`
  - 로그아웃 후 `/` 이동
- 신고(Reports) MVP
  - 게시글/댓글 신고 모달
  - 중복 신고 방지(unique) 에러 메시지 처리
- `/admin` 운영 화면
  - admin 권한(`profiles.role='admin'`) 접근 제어
  - 신고 리스트(status 필터 + created_at desc)
  - 신고 상태 변경(status/reviewed_by/reviewed_at/notes)
  - RPC 기반 숨김 처리
    - `admin_soft_delete_post`
    - `admin_soft_delete_comment`

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
   - `docs/sql/posts.sql`
   - `docs/sql/votes.sql`
   - `docs/sql/reports.sql`
2. 랭킹 뷰 생성
   - `weekly_post_rankings`
   - `monthly_post_rankings`
   - SQL은 `docs/1.md` Part 8 섹션 참고
3. Supabase Auth > Providers에서 Google 활성화 (Kakao는 선택)
4. Auth Redirect URL에 `/auth/callback` 경로 등록
5. Cloudflare R2 버킷과 Public Base URL 설정

## 폴더 구조
```text
app/
  admin/page.tsx
  api/posts/route.ts
  api/reports/route.ts
  api/upload/route.ts
  api/votes/route.ts
  auth/callback/route.ts
  feed/page.tsx
  me/page.tsx
  me/loading.tsx
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
    VoteButton.tsx
  admin/
    AdminReportsClient.tsx
    ReportDetail.tsx
    ReportsTable.tsx
  me/
    AccountDangerZone.tsx
    MyComments.tsx
    MyLikes.tsx
    MyPosts.tsx
    ProfileEditor.tsx
  report/
    ReportButton.tsx
    ReportModal.tsx
hooks/
  useVote.ts
lib/
  mock.ts
  posts.ts
  r2.ts
  rankings.ts
  reports.ts
  admin.ts
  votes.ts
  supabase/
    client.ts
    server.ts
docs/
  1.md
  sql/profiles.sql
  sql/posts.sql
  sql/reports.sql
  sql/votes.sql
  진행사항.md
supabase/
  migrations/20260216_create_posts.sql
  migrations/20260216_create_reports_admin.sql
  migrations/20260216_profiles_soft_delete.sql
  migrations/20260216_create_votes.sql
```

## 주의 사항
- `posts`는 soft delete(`deleted_at`)를 사용합니다.
- `profiles`도 soft delete(`deleted_at`)를 사용합니다.
- 관리자 기능은 `profiles.role='admin'` 권한과 reports RLS 정책을 전제로 동작합니다.
- 현재 단계에서는 **comments 고도화(신고/정렬/통계)는 아직 미구현**입니다.
- R2 Access Key/Secret은 서버 API에서만 사용하며 클라이언트에 노출되지 않습니다.
