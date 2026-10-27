-- =========================================================
-- Kinflow · estructura de la base (Supabase / Postgres 17)
-- Estado aplicado el 27/10/2026 (migraciones: kinflow_core, kinflow_auth_functions,
-- kinflow_harden_functions, kinflow_member_own_user_upsert).
-- =========================================================

-- ---------- Tablas ----------
create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tenant_users (
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  app_user_id text not null,
  role text not null check (role in ('admin','coach','member')),
  status text not null default 'active',
  created_at timestamptz not null default now(),
  primary key (tenant_id, user_id),
  unique (tenant_id, app_user_id)
);
create index tenant_users_user_idx on public.tenant_users(user_id);

create table public.records (
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  collection text not null,
  id text not null,
  user_id text,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (tenant_id, collection, id)
);
create index records_user_idx on public.records(tenant_id, collection, user_id);

alter table public.tenants enable row level security;
alter table public.tenant_users enable row level security;
alter table public.records enable row level security;

-- ---------- Helpers de permisos ----------
create or replace function public.kf_role(t uuid) returns text
language sql stable security definer set search_path = public as $$
  select role from public.tenant_users
  where tenant_id = t and user_id = auth.uid() and status <> 'suspended'
$$;

create or replace function public.kf_is_staff(t uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.kf_role(t) in ('admin','coach'), false)
$$;

create or replace function public.kf_app_user(t uuid) returns text
language sql stable security definer set search_path = public as $$
  select app_user_id from public.tenant_users
  where tenant_id = t and user_id = auth.uid() and status <> 'suspended'
$$;

create or replace function public.kf_member_readable(c text) returns boolean
language sql immutable set search_path = public as $$
  select c = any (array[
    'class_templates','class_sessions','membership_plans','posts','wods','products',
    'challenges','programs','program_sessions','exercises',
    'bookings','checkins','personal_records','challenge_participants'
  ])
$$;

create or replace function public.kf_member_writable(c text) returns boolean
language sql immutable set search_path = public as $$
  select c = any (array[
    'users','personal_records','body_metrics','orders','notifications',
    'program_assignments','program_progress','challenge_participants'
  ])
$$;

-- ---------- Políticas RLS ----------
create policy tenants_select on public.tenants for select to authenticated
  using (public.kf_role(id) is not null);
create policy tenants_update on public.tenants for update to authenticated
  using (public.kf_role(id) = 'admin') with check (public.kf_role(id) = 'admin');

create policy tenant_users_select on public.tenant_users for select to authenticated
  using (user_id = auth.uid() or public.kf_is_staff(tenant_id));

create policy records_select on public.records for select to authenticated
  using (public.kf_is_staff(tenant_id)
    or (public.kf_role(tenant_id) = 'member'
        and (public.kf_member_readable(collection) or user_id = public.kf_app_user(tenant_id))));
create policy records_insert on public.records for insert to authenticated
  with check (public.kf_is_staff(tenant_id)
    or (public.kf_role(tenant_id) = 'member' and public.kf_member_writable(collection)
        and user_id = public.kf_app_user(tenant_id)));
create policy records_update on public.records for update to authenticated
  using (public.kf_is_staff(tenant_id)
    or (public.kf_role(tenant_id) = 'member' and public.kf_member_writable(collection)
        and user_id = public.kf_app_user(tenant_id)))
  with check (public.kf_is_staff(tenant_id)
    or (public.kf_role(tenant_id) = 'member' and public.kf_member_writable(collection)
        and user_id = public.kf_app_user(tenant_id)));
create policy records_delete on public.records for delete to authenticated
  using (public.kf_is_staff(tenant_id)
    or (public.kf_role(tenant_id) = 'member'
        and collection = any (array['personal_records','body_metrics','program_progress'])
        and user_id = public.kf_app_user(tenant_id)));

-- ---------- Triggers ----------
create or replace function public.kf_records_before() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.user_id := case when new.collection = 'users' then new.id else new.data->>'userId' end;
  new.updated_at := now();
  if tg_op = 'UPDATE' and new.collection = 'users' and not public.kf_is_staff(new.tenant_id) then
    new.data := new.data
      || jsonb_build_object('role', old.data->'role', 'status', old.data->'status', 'email', old.data->'email');
  end if;
  if new.collection = 'users' then
    new.data := new.data - 'passwordHash';
  end if;
  return new;
end $$;
create trigger records_before before insert or update on public.records
  for each row execute function public.kf_records_before();

create or replace function public.kf_records_users_after() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.collection = 'users' then
    update public.tenant_users
       set role = coalesce(new.data->>'role', role), status = coalesce(new.data->>'status', status)
     where tenant_id = new.tenant_id and app_user_id = new.id
       and (new.data->>'role') in ('admin','coach','member');
  end if;
  return new;
end $$;
create trigger records_users_after after insert or update on public.records
  for each row execute function public.kf_records_users_after();

create or replace function public.kf_touch() returns trigger
language plpgsql set search_path = public as $$ begin new.updated_at := now(); return new; end $$;
create trigger tenants_touch before update on public.tenants
  for each row execute function public.kf_touch();

-- ---------- Funciones que usa la app ----------
create or replace function public.kf_my_tenants()
returns table (tenant_id uuid, role text, app_user_id text, status text, tenant_name text)
language sql stable security definer set search_path = public as $$
  select tu.tenant_id, tu.role, tu.app_user_id, tu.status, t.data->>'name'
  from public.tenant_users tu join public.tenants t on t.id = tu.tenant_id
  where tu.user_id = auth.uid()
  order by tu.created_at
$$;

create or replace function public.kf_directory(t uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  select case when public.kf_role(t) is null then '[]'::jsonb else coalesce(jsonb_agg(
    jsonb_build_object(
      'id', r.id, 'tenantId', t::text, 'name', r.data->'name', 'avatar', r.data->'avatar',
      'role', r.data->'role', 'status', r.data->'status',
      'createdAt', r.data->'createdAt', 'updatedAt', r.data->'updatedAt', 'email', ''
    )), '[]'::jsonb) end
  from public.records r where r.tenant_id = t and r.collection = 'users'
$$;

create or replace function public.kf_get_invitation(p_code text) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'tenantId', r.tenant_id, 'tenantName', t.data->>'name', 'tenantLogo', t.data->>'logo',
    'brandColor', t.data->>'brandColor', 'role', r.data->>'role', 'email', r.data->>'email',
    'expiresAt', r.data->>'expiresAt',
    'status', case
      when r.data->>'status' <> 'pending' then r.data->>'status'
      when (r.data->>'expiresAt')::timestamptz < now() then 'expired'
      else 'pending' end)
  from public.records r join public.tenants t on t.id = r.tenant_id
  where r.collection = 'invitations' and upper(r.data->>'code') = upper(trim(p_code))
  limit 1
$$;

-- kf_handle_new_user(): ver la migración kinflow_auth_functions (crea el box o une
-- a la persona al box de la invitación, con su plan) y el trigger:
-- create trigger kf_on_auth_user_created after insert on auth.users
--   for each row execute function public.kf_handle_new_user();

-- ---------- Permisos de ejecución ----------
revoke execute on function public.kf_records_before(), public.kf_records_users_after(),
  public.kf_handle_new_user() from public, anon, authenticated;
revoke execute on function public.kf_role(uuid), public.kf_is_staff(uuid), public.kf_app_user(uuid),
  public.kf_my_tenants(), public.kf_directory(uuid), public.kf_get_invitation(text) from public, anon;
grant execute on function public.kf_role(uuid), public.kf_is_staff(uuid), public.kf_app_user(uuid),
  public.kf_my_tenants(), public.kf_directory(uuid) to authenticated;
grant execute on function public.kf_get_invitation(text) to anon, authenticated;
