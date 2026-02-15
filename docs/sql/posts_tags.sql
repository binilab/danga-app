-- DANGA Part 15: posts.tags(text[]) 컬럼 추가

alter table public.posts
add column if not exists tags text[] not null default '{}';

comment on column public.posts.tags is '게시글 태그 목록(최대 5개, 각 1~20자)';

create index if not exists posts_tags_gin_idx
  on public.posts
  using gin (tags)
  where deleted_at is null;
