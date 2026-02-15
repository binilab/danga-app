-- DANGA Part 10: reports + admin moderation RPC

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('post', 'comment')),
  target_id uuid not null,
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reason text not null,
  status text not null default 'open' check (status in ('open', 'reviewing', 'resolved', 'rejected')),
  created_at timestamptz not null default now(),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  notes text
);

create unique index if not exists reports_unique_once
  on public.reports (target_type, target_id, reporter_id);

create index if not exists reports_status_created_at_desc_idx
  on public.reports (status, created_at desc);

alter table public.reports enable row level security;

create or replace function public.is_admin(p_user_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = p_user_id
      and role = 'admin'
      and deleted_at is null
  );
$$;

drop policy if exists "reports_select_own" on public.reports;
create policy "reports_select_own"
on public.reports
for select
to authenticated
using (auth.uid() = reporter_id);

drop policy if exists "reports_insert_own" on public.reports;
create policy "reports_insert_own"
on public.reports
for insert
to authenticated
with check (auth.uid() = reporter_id);

drop policy if exists "reports_select_admin_all" on public.reports;
create policy "reports_select_admin_all"
on public.reports
for select
to authenticated
using (public.is_admin(auth.uid()));

drop policy if exists "reports_update_admin" on public.reports;
create policy "reports_update_admin"
on public.reports
for update
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create or replace function public.admin_soft_delete_post(p_post_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'not admin';
  end if;

  update public.posts
  set deleted_at = now()
  where id = p_post_id;
end;
$$;

create or replace function public.admin_soft_delete_comment(p_comment_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'not admin';
  end if;

  update public.comments
  set deleted_at = now()
  where id = p_comment_id;
end;
$$;
