-- DANGA Part 6: votes 테이블 (좋아요 MVP)
-- comments는 이후 파트에서 생성 예정

create table if not exists public.votes (
  post_id uuid not null references public.posts(id) on delete cascade,
  voter_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, voter_id)
);

comment on table public.votes is '게시글 좋아요';

create index if not exists votes_voter_id_idx
  on public.votes (voter_id);

create index if not exists votes_created_at_desc_idx
  on public.votes (created_at desc);

alter table public.votes enable row level security;

-- 누구나 좋아요 수 집계를 읽을 수 있음
drop policy if exists "votes_select_all" on public.votes;
create policy "votes_select_all"
on public.votes
for select
to anon, authenticated
using (true);

-- 로그인 사용자는 본인 좋아요만 생성 가능
drop policy if exists "votes_insert_own" on public.votes;
create policy "votes_insert_own"
on public.votes
for insert
to authenticated
with check (auth.uid() = voter_id);

-- 로그인 사용자는 본인 좋아요만 삭제 가능
drop policy if exists "votes_delete_own" on public.votes;
create policy "votes_delete_own"
on public.votes
for delete
to authenticated
using (auth.uid() = voter_id);
