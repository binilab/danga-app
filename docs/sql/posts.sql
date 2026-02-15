-- DANGA Part 5: posts 테이블 (soft delete + RLS)
-- votes / comments는 Part 6+에서 생성 예정

create extension if not exists pgcrypto;

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  image_url text not null,
  image_key text,
  caption text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

comment on table public.posts is '패션 커뮤니티 게시글';
comment on column public.posts.deleted_at is 'soft delete 시각';

create index if not exists posts_created_at_desc_idx
  on public.posts (created_at desc)
  where deleted_at is null;

create index if not exists posts_user_id_created_at_desc_idx
  on public.posts (user_id, created_at desc)
  where deleted_at is null;

create index if not exists posts_deleted_at_idx
  on public.posts (deleted_at);

alter table public.posts enable row level security;

-- 피드는 공개 조회 가능(soft delete 제외)
drop policy if exists "posts_select_public_active" on public.posts;
create policy "posts_select_public_active"
on public.posts
for select
to anon, authenticated
using (deleted_at is null);

-- 로그인 사용자는 본인 글만 생성 가능
drop policy if exists "posts_insert_own" on public.posts;
create policy "posts_insert_own"
on public.posts
for insert
to authenticated
with check (auth.uid() = user_id and deleted_at is null);

-- 로그인 사용자는 본인 글만 수정 가능(soft delete 포함)
drop policy if exists "posts_update_own" on public.posts;
create policy "posts_update_own"
on public.posts
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- updated_at 자동 갱신 함수(없으면 생성)
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists posts_set_updated_at on public.posts;
create trigger posts_set_updated_at
before update on public.posts
for each row
execute function public.set_updated_at();
