# DANGA (danga.site)

패션 평가 커뮤니티 **DANGA**의 프론트엔드 프로젝트입니다.  
슬로건: **단번에 가자 (나이스 패션이다)**

## 프로젝트 소개
- 코디를 올리고, 투표와 댓글로 빠르게 평가받는 커뮤니티를 목표로 합니다.
- 현재는 UI 기반 뼈대 + Supabase Auth + R2 이미지 업로드 파이프라인까지 구현된 상태입니다.

## 기술 스택
- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Supabase Auth
- Cloudflare R2 (S3 호환 API)

## 구현 상태
### Part 1 뼈대
- 기본 라우트 구성
  - `/`
  - `/feed`
  - `/rank`
  - `/me`
  - `/post/new`
  - `/p/[id]`
  - `/admin`
- 공통 헤더/레이아웃 구성
- 더미 데이터 분리(`lib/mock.ts`)

### 랜딩 고도화 (UI)
- `app/page.tsx`는 섹션 조립만 담당
- 랜딩 섹션 컴포넌트 분리
  - `components/landing/Hero.tsx`
  - `components/landing/HowItWorks.tsx`
  - `components/landing/SampleGallery.tsx`
  - `components/landing/RankPreview.tsx`
  - `components/landing/CTA.tsx`

### Part 3 Auth
- Supabase 클라이언트 설정
  - `lib/supabase/client.ts` (브라우저용)
  - `lib/supabase/server.ts` (서버용)
- OAuth callback 라우트
  - `app/auth/callback/route.ts`
- 헤더 인증 상태 반영
  - 비로그인: `시작하기` 버튼 클릭 시 로그인 모달 오픈
  - 로그인: 원형 프로필 버튼 + 드롭다운 메뉴(`내 피드`, `업로드`, `로그아웃`)
- 로그인 모달
  - Google / Kakao 로그인 버튼
  - Kakao 미설정 시 안내 문구/에러 표시
- profiles 테이블 SQL 가이드
  - `docs/sql/profiles.sql`

### Part 4 R2 이미지 업로드
- 서버 전용 R2 유틸
  - `lib/r2.ts`
  - `@aws-sdk/client-s3` 사용
  - key 규칙: `posts/{userId}/{timestamp}-{random}.{ext}`
  - 업로드 시 `ContentType` 설정
- 업로드 API 라우트
  - `app/api/upload/route.ts`
  - `multipart/form-data`의 `file` 필드 처리
  - 허용 형식: `image/png`, `image/jpeg`, `image/webp`
  - 최대 용량: 5MB
  - 성공 응답: `{ ok: true, key, url }`
- `/post/new` 업로더 UI
  - 파일 선택 + 업로드 버튼
  - 업로드 중 로딩/버튼 비활성화
  - 성공 시 미리보기 + URL + 복사 버튼
  - 실패 시 친화적 에러 표시

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
1. Supabase SQL Editor에서 `docs/sql/profiles.sql` 실행
2. Supabase Auth > Providers에서 Google 활성화 (Kakao는 선택)
3. Auth Redirect URL에 `/auth/callback` 경로 등록
4. Cloudflare R2 버킷과 Public Base URL 설정 완료

## 폴더 구조
```text
app/
  admin/page.tsx
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
lib/
  mock.ts
  r2.ts
  supabase/
    client.ts
    server.ts
docs/
  sql/profiles.sql
  진행사항.md
```

## 주의 사항
- 현재 단계에서는 **posts/votes/comments 테이블은 아직 만들지 않습니다.**
- R2 Access Key/Secret은 서버 API에서만 사용하며 클라이언트에 노출되지 않습니다.
