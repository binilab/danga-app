-- DANGA Part 14: in-app notifications MVP

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('vote', 'comment', 'report_update')),
  actor_id uuid references auth.users(id) on delete set null,
  post_id uuid references public.posts(id) on delete cascade,
  comment_id uuid references public.comments(id) on delete cascade,
  report_id uuid references public.reports(id) on delete cascade,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_created_idx
  on public.notifications (user_id, created_at desc);

create index if not exists notifications_user_unread_idx
  on public.notifications (user_id, created_at desc)
  where is_read = false;

alter table public.notifications enable row level security;

drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own"
on public.notifications
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own"
on public.notifications
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "notifications_delete_own" on public.notifications;
create policy "notifications_delete_own"
on public.notifications
for delete
to authenticated
using (auth.uid() = user_id);

create or replace function public.notify_vote(p_post_id uuid, p_actor_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  owner_id uuid;
begin
  select user_id into owner_id
  from public.posts
  where id = p_post_id and deleted_at is null;

  if owner_id is null then
    return;
  end if;

  if owner_id = p_actor_id then
    return;
  end if;

  insert into public.notifications (user_id, type, actor_id, post_id, message)
  values (
    owner_id,
    'vote',
    p_actor_id,
    p_post_id,
    '누군가 내 게시글에 좋아요를 눌렀어요.'
  );
end;
$$;

create or replace function public.notify_comment(
  p_post_id uuid,
  p_comment_id uuid,
  p_actor_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  owner_id uuid;
begin
  select user_id into owner_id
  from public.posts
  where id = p_post_id and deleted_at is null;

  if owner_id is null then
    return;
  end if;

  if owner_id = p_actor_id then
    return;
  end if;

  insert into public.notifications (user_id, type, actor_id, post_id, comment_id, message)
  values (
    owner_id,
    'comment',
    p_actor_id,
    p_post_id,
    p_comment_id,
    '누군가 내 게시글에 댓글을 남겼어요.'
  );
end;
$$;

revoke all on function public.notify_vote(uuid, uuid) from public;
grant execute on function public.notify_vote(uuid, uuid) to authenticated;

revoke all on function public.notify_comment(uuid, uuid, uuid) from public;
grant execute on function public.notify_comment(uuid, uuid, uuid) to authenticated;
