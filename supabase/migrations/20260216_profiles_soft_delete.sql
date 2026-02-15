-- DANGA Part 9: profiles soft delete 지원

alter table public.profiles
add column if not exists deleted_at timestamptz;

comment on column public.profiles.deleted_at is '계정 soft delete 시각';

create index if not exists profiles_deleted_at_idx
  on public.profiles (deleted_at);
