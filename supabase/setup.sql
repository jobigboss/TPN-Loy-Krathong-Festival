-- Run in your Supabase project's SQL Editor. Safe to run again.
begin;
create table if not exists public.festival_wishes (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 24),
  wish text not null check (char_length(wish)<=100),
  style text not null check (style in ('lotus','rose','gold')),
  x double precision not null default (0.12+random()*0.76),
  y double precision not null default (0.38+random()*0.48),
  created bigint not null default (extract(epoch from clock_timestamp())*1000)::bigint
);
create index if not exists festival_wishes_created on public.festival_wishes(created desc,id desc);
alter table public.festival_wishes enable row level security;
revoke all on public.festival_wishes from anon,authenticated;
grant select on public.festival_wishes to anon,authenticated;
drop policy if exists "Read public wishes" on public.festival_wishes;
create policy "Read public wishes" on public.festival_wishes for select to anon,authenticated using (true);

create schema if not exists festival_private;
revoke all on schema festival_private from public,anon,authenticated;
create table if not exists festival_private.cooldowns(device uuid primary key,last_sent timestamptz not null);

-- Only this function can write; clients cannot change/delete wishes or set coordinates.
create or replace function public.float_festival_wish(p_name text,p_wish text,p_style text,p_device uuid)
returns setof public.festival_wishes
language plpgsql security definer set search_path=''
as $$
begin
  if p_name is null or p_wish is null or p_style is null or p_device is null
    or char_length(p_name)>24 or char_length(p_wish)>100
    or p_style not in ('lotus','rose','gold') then
    raise exception 'ข้อมูลไม่ถูกต้อง';
  end if;
  insert into festival_private.cooldowns(device,last_sent) values(p_device,clock_timestamp())
  on conflict(device) do update set last_sent=excluded.last_sent
  where festival_private.cooldowns.last_sent<clock_timestamp()-interval '2 seconds';
  if not found then raise exception 'กรุณารอสักครู่ก่อนลอยกระทงอีกครั้ง';end if;
  delete from festival_private.cooldowns where last_sent<clock_timestamp()-interval '1 day';
  return query insert into public.festival_wishes(name,wish,style)
  values(coalesce(nullif(btrim(p_name),''),'ผู้ร่วมงาน'),btrim(p_wish),p_style) returning *;
end;
$$;
revoke all on function public.float_festival_wish(text,text,text,uuid) from public,anon,authenticated;
grant execute on function public.float_festival_wish(text,text,text,uuid) to anon,authenticated;
commit;
