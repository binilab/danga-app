-- DANGA Part 12 (optional): profiles 암호화 컬럼 + admin 조회 RPC

alter table public.profiles
add column if not exists email_enc text,
add column if not exists name_enc text;

comment on column public.profiles.email_enc is '암호화된 이메일(base64 AES-GCM)';
comment on column public.profiles.name_enc is '암호화된 이름(base64 AES-GCM)';

create or replace function public.admin_list_profile_identities(p_user_ids uuid[])
returns table (
  id uuid,
  nickname text,
  email_enc text,
  name_enc text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'not admin';
  end if;

  return query
  select p.id, p.nickname, p.email_enc, p.name_enc
  from public.profiles p
  where p.id = any(p_user_ids);
end;
$$;
