# DANGA (danga.site)

패션 평가 커뮤니티 DANGA 프로젝트입니다.  
슬로건: **단번에 가자 (나이스 패션이다)**

## MVP 상태
- 상태: MVP 구현 완료
- 핵심 플로우: 로그인 -> 이미지 업로드 -> 게시글 작성 -> 피드/상세 -> 좋아요/댓글 -> 랭킹/알림
- UI 톤: 미니멀 + 빠르고 경쾌한 카피/레이아웃으로 통일

## 주요 기능
### 사용자 기능
- 랜딩: 섹션형 소개 + CTA
- 피드 `/feed`: 최신순 목록, 좋아요 토글, 태그 chip, 검색 진입
- 상세 `/p/[id]`: 게시글/댓글/신고/좋아요
- 글쓰기 `/post/new`: R2 업로드 + 캡션/태그 저장
- 검색 `/search`: 키워드 + 태그 필터, 더보기
- 랭킹 `/rank`: 주간/월간 탭, Top 50, 배지/점수
- 마이 `/me`: 내 글/좋아요/댓글, 프로필 수정, 탈퇴(soft delete)
- 알림 `/notifications`: 좋아요/댓글 알림, 읽음 처리

### 운영 기능
- 신고 등록(게시글/댓글)
- 관리자 `/admin`: 권한 체크, 신고 상태 변경, soft delete RPC 실행

### 품질/운영
- SEO metadata, OG/Twitter
- `robots.txt`, `sitemap.xml`
- 정책 페이지 `/privacy`, `/terms`, `/contact`
- `next/image` 최적화 + remotePatterns
- 서버 전용 AES-256-GCM 암호화 유틸

## 기술 스택
- Next.js 16 (App Router)
- React 19 + TypeScript
- Tailwind CSS 4
- Supabase (Auth + Postgres)
- Cloudflare R2 (S3 호환)

## 빠른 시작
```bash
npm install
npm run dev
```

로컬 주소: `http://localhost:3000`

## 환경 변수
`.env.local`에 아래 값을 설정합니다.

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# Cloudflare R2
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=...
R2_PUBLIC_BASE_URL=...

# Encryption (base64 32bytes)
APP_ENCRYPTION_KEY=...
```

## Supabase 초기 설정
### 1) SQL 실행
아래 SQL 파일을 순서대로 실행합니다.
- `docs/sql/profiles.sql`
- `docs/sql/posts.sql`
- `docs/sql/posts_tags.sql`
- `docs/sql/votes.sql`
- `docs/sql/notifications.sql`
- `docs/sql/reports.sql`
- `docs/sql/profiles_encryption.sql` (선택)

### 2) Auth Provider
- Google OAuth 활성화
- Redirect URL에 `/auth/callback` 등록
- Kakao는 선택 사항(미설정 시 UI 안내)

### 3) 랭킹 뷰/RPC
- `weekly_post_rankings`, `monthly_post_rankings`
- `notify_vote`, `notify_comment`, `admin_soft_delete_post`, `admin_soft_delete_comment` 등
- 상세 SQL/작업 메모는 `docs/1.md` 참고

## 주요 라우트
- 공개: `/`, `/feed`, `/rank`, `/search`, `/p/[id]`, `/privacy`, `/terms`, `/contact`
- 로그인 기반: `/post/new`, `/me`, `/notifications`
- 관리자: `/admin`
- API: `/api/upload`, `/api/posts`, `/api/votes`, `/api/comments`, `/api/reports`, `/api/profiles/encrypted`, `/auth/callback`

## 프로젝트 구조(요약)
```text
app/                # App Router 페이지 및 API
components/         # UI/도메인 컴포넌트
lib/                # 데이터 로직, Supabase, R2, 유틸
docs/sql/           # 수동 실행용 SQL
supabase/migrations # 마이그레이션 SQL
docs/진행사항.md     # MVP 최종 진행 정리
docs/1.md           # 다음 작업 계획/실험 노트
```

## 검증 상태
- `npm run lint` 통과
- `npm run build` 통과

## 참고 문서
- MVP 최종 정리: `docs/진행사항.md`
- 다음 작업 계획: `docs/1.md`

## 주의 사항
- `posts`는 soft delete(`deleted_at`)를 사용합니다.
- `profiles`도 soft delete(`deleted_at`)를 사용합니다.
- 관리자 기능은 `profiles.role='admin'` 권한과 reports RLS 정책을 전제로 동작합니다.
- 현재 단계에서는 **comments 고도화(신고/정렬/통계)는 아직 미구현**입니다.
- R2 Access Key/Secret은 서버 API에서만 사용하며 클라이언트에 노출되지 않습니다.
