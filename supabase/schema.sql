-- Thunder Stallion — Supabase schema
-- Run once in the Supabase SQL editor (Dashboard → SQL → New query → paste → Run).
-- Safe to re-run: objects are created if missing and functions are replaced.

create extension if not exists pgcrypto;

-- ───────────────────────────── Profiles ─────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  username text not null check (username ~ '^[A-Za-z0-9_]{3,20}$'),
  telegram text not null default '',
  is_admin boolean not null default false,
  wallet_address text,                       -- reserved for wallet sign-in
  created_at timestamptz not null default now()
);
create unique index if not exists profiles_username_key on public.profiles (lower(username));
-- Usernames: 3–20 letters (any language), numbers, spaces, _ . -  (the sign-up form checks the same rule)
alter table public.profiles drop constraint if exists profiles_username_check;
alter table public.profiles add constraint profiles_username_check
  check (char_length(username) between 3 and 20 and username = btrim(username) and username !~ '[@[:cntrl:]]');

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false)
$$;

-- ───────────────────────────── Listings ─────────────────────────────
create sequence if not exists public.listing_seq;

create table if not exists public.listings (
  id text primary key default ('TS-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.listing_seq')::text, 6, '0')),
  user_id uuid references public.profiles (id) on delete set null,
  username text not null default '',          -- kept for legacy rows with no account yet
  project_name text not null,
  symbol text not null default '',
  chain text not null,
  contract text not null,
  pair_address text not null default '',
  logo_url text not null default '',
  banner_url text not null default '',
  description text not null default '',
  category text not null default '',
  links jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  rejected_reason text not null default '',
  featured boolean not null default false,
  admin_votes integer not null default 0,
  submitted_at timestamptz not null default now(),
  approved_at timestamptz
);
create unique index if not exists listings_live_token on public.listings (chain, lower(contract)) where status <> 'rejected';
create index if not exists listings_status on public.listings (status, approved_at desc);
create index if not exists listings_user on public.listings (user_id);

-- Users can only create pending listings for themselves; admins (and SQL run
-- from the dashboard, where there is no signed-in user) can do anything.
create or replace function public.listings_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  -- a signed-in submitter (admins included) always owns what they submit, so it shows under "My listings"
  if tg_op = 'INSERT' and auth.uid() is not null then
    new.user_id := coalesce(new.user_id, auth.uid());
    if coalesce(new.username, '') = '' then
      new.username := coalesce((select username from public.profiles where id = new.user_id), '');
    end if;
  end if;
  if tg_op = 'INSERT' and auth.uid() is not null and not public.is_admin() then
    new.user_id := auth.uid();
    new.username := coalesce((select username from public.profiles where id = auth.uid()), '');
    new.status := 'pending';
    new.featured := false;
    new.admin_votes := 0;
    new.rejected_reason := '';
    new.approved_at := null;
  end if;
  if new.status = 'approved' and new.approved_at is null then
    new.approved_at := now();
  end if;
  return new;
end $$;
drop trigger if exists listings_guard on public.listings;
create trigger listings_guard before insert or update on public.listings
  for each row execute function public.listings_guard();

-- ───────────────────────────── Pricing ─────────────────────────────
create table if not exists public.tiers (
  code text primary key,
  product text not null check (product in ('trend', 'profile', 'banner')),
  price_usd numeric(10, 2) not null,
  compare_at_usd numeric(10, 2),
  points integer not null default 0,
  duration_hours integer,                     -- null = permanent
  sort integer not null default 0,
  active boolean not null default true
);

insert into public.tiers (code, product, price_usd, compare_at_usd, points, duration_hours, sort) values
  ('t1', 'trend', 50, 100, 100, 12, 1),
  ('t2', 'trend', 100, 200, 200, 12, 2),
  ('t3', 'trend', 300, 600, 1000, 24, 3),
  ('t4', 'trend', 500, 1000, 2000, 48, 4),
  ('t5', 'trend', 750, 1500, 10000, 48, 5),
  ('elite', 'profile', 148, null, 0, null, 1),
  ('b1', 'banner', 120, null, 0, 24, 1),
  ('b2', 'banner', 300, null, 0, 72, 2),
  ('b3', 'banner', 600, null, 0, 168, 3)
on conflict (code) do nothing;

create table if not exists public.settings (
  key text primary key,
  value jsonb not null
);
insert into public.settings (key, value) values ('sale_active', 'true'::jsonb) on conflict (key) do nothing;

-- ───────────────────────────── Orders ─────────────────────────────
create sequence if not exists public.order_seq;

create table if not exists public.orders (
  id text primary key default ('ORD-' || lpad(nextval('public.order_seq')::text, 6, '0')),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  username text not null default '',
  product text not null check (product in ('trend', 'profile', 'banner')),
  tier_code text not null references public.tiers (code),
  chain text not null,
  address text not null,
  token_name text not null default '',
  token_symbol text not null default '',
  banner_url text not null default '',
  link_url text not null default '',
  pay_token text not null check (pay_token in ('USDC', 'USDT', 'SOL', 'BNB', 'ETH')),
  pay_network text not null default '',
  amount_usd numeric(10, 2) not null default 0,
  points integer not null default 0,
  duration_hours integer,
  status text not null default 'awaiting_payment' check (status in ('awaiting_payment', 'active', 'expired', 'cancelled')),
  tx_hash text not null default '',            -- filled in once on-chain payments go live
  created_at timestamptz not null default now(),
  starts_at timestamptz,
  ends_at timestamptz
);
-- ADMIN marks boosts an admin added for free from the panel.
alter table public.orders drop constraint if exists orders_pay_token_check;
alter table public.orders add constraint orders_pay_token_check check (pay_token in ('USDC', 'USDT', 'SOL', 'BNB', 'ETH', 'ADMIN'));
create index if not exists orders_running on public.orders (status, ends_at);
create index if not exists orders_user on public.orders (user_id, created_at desc);

-- Price, points and duration always come from the tiers table, never the client.
create or replace function public.orders_guard() returns trigger
language plpgsql security definer set search_path = public as $$
declare t public.tiers;
begin
  if auth.uid() is not null and not public.is_admin() and new.pay_token = 'ADMIN' then
    raise exception 'Invalid payment token';
  end if;
  -- Every paid order (admins' test orders included) is priced from the tiers table.
  -- Free admin boosts (pay_token ADMIN, from admin_add_trending) are already filled in.
  if auth.uid() is not null and new.pay_token <> 'ADMIN' then
    select * into t from public.tiers where code = new.tier_code and product = new.product and active;
    if not found then raise exception 'Unknown package %', new.tier_code; end if;
    new.user_id := coalesce(new.user_id, auth.uid());
    if coalesce(new.username, '') = '' then
      new.username := coalesce((select username from public.profiles where id = new.user_id), '');
    end if;
    new.amount_usd := t.price_usd;
    new.points := t.points;
    new.duration_hours := t.duration_hours;
  end if;
  if auth.uid() is not null and not public.is_admin() then
    new.user_id := auth.uid();
    new.username := coalesce((select username from public.profiles where id = auth.uid()), '');
    new.status := 'awaiting_payment';
    new.tx_hash := '';
    new.starts_at := null;
    new.ends_at := null;
  end if;
  return new;
end $$;
-- Repair orders that admins placed before admins' orders were priced (showed $0 and no points).
update public.orders o set amount_usd = t.price_usd, points = t.points, duration_hours = t.duration_hours,
  ends_at = case when o.status = 'active' and t.duration_hours is not null then coalesce(o.starts_at, now()) + make_interval(hours => t.duration_hours) else o.ends_at end
from public.tiers t
where t.code = o.tier_code and o.pay_token <> 'ADMIN' and o.amount_usd = 0;
drop trigger if exists orders_guard on public.orders;
create trigger orders_guard before insert on public.orders
  for each row execute function public.orders_guard();

-- Public, safe columns of currently running orders (drives the board, banners, elite profiles).
create or replace view public.active_boosts as
  select product, tier_code, chain, address, token_name, token_symbol, points, banner_url, link_url, starts_at, ends_at
  from public.orders
  where status = 'active' and (ends_at is null or ends_at > now());

create or replace function public.admin_order_action(order_id text, action text) returns void
language plpgsql security definer set search_path = public as $$
declare o public.orders;
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  select * into o from public.orders where id = order_id for update;
  if not found then raise exception 'Order not found'; end if;
  if action = 'activate' then
    update public.orders set status = 'active', starts_at = now(),
      ends_at = case when duration_hours is null then null else now() + make_interval(hours => duration_hours) end
    where id = order_id;
  elsif action = 'cancel' then
    update public.orders set status = 'cancelled' where id = order_id;
  elsif action = 'extend' then
    update public.orders set status = 'active', ends_at = greatest(now(), coalesce(ends_at, now())) + interval '24 hours'
    where id = order_id and ends_at is not null;
  elsif action = 'end' then
    update public.orders set status = 'expired', ends_at = now() where id = order_id;
  else
    raise exception 'Unknown action %', action;
  end if;
end $$;

-- Admin "Add trending": a free boost that starts immediately, priced from the tiers table.
create or replace function public.admin_add_trending(p_chain text, p_address text, p_tier text, p_name text, p_symbol text, p_banner text)
returns text
language plpgsql security definer set search_path = public as $$
declare t public.tiers; new_id text;
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  select * into t from public.tiers where code = p_tier and product = 'trend';
  if not found then raise exception 'Unknown tier %', p_tier; end if;
  insert into public.orders (user_id, username, product, tier_code, chain, address, token_name, token_symbol, banner_url,
                             pay_token, pay_network, amount_usd, points, duration_hours, status, starts_at, ends_at)
  values (auth.uid(), coalesce((select username from public.profiles where id = auth.uid()), ''), 'trend', t.code, p_chain, p_address,
          coalesce(p_name, ''), coalesce(p_symbol, ''), coalesce(p_banner, ''), 'ADMIN', 'admin', 0, t.points, t.duration_hours, 'active', now(),
          case when t.duration_hours is null then null else now() + make_interval(hours => t.duration_hours) end)
  returning id into new_id;
  return new_id;
end $$;

-- ───────────────────────────── Votes ─────────────────────────────
create table if not exists public.votes (
  id bigserial primary key,
  coin_key text not null,                      -- chain:lower(address)
  chain text not null,
  address text not null,
  name text not null default '',
  symbol text not null default '',
  voter text not null,                         -- user:<uuid> or client:<browser id>
  created_at timestamptz not null default now(),
  unique (coin_key, voter)
);

create or replace function public.coin_votes(p_chain text, p_address text) returns integer
language sql stable security definer set search_path = public as $$
  select (select count(*) from public.votes where coin_key = p_chain || ':' || lower(p_address))::int
       + coalesce((select sum(admin_votes) from public.listings where chain = p_chain and lower(contract) = lower(p_address)), 0)::int
$$;

create or replace function public.vote_status(p_chain text, p_address text, p_client text)
returns table (votes integer, voted boolean)
language sql stable security definer set search_path = public as $$
  select public.coin_votes(p_chain, p_address),
         exists (select 1 from public.votes where coin_key = p_chain || ':' || lower(p_address)
                 and voter = case when auth.uid() is not null then 'user:' || auth.uid() else 'client:' || p_client end)
$$;

create or replace function public.cast_vote(p_chain text, p_address text, p_name text, p_symbol text, p_client text)
returns table (votes integer, voted boolean)
language plpgsql security definer set search_path = public as $$
declare who text := case when auth.uid() is not null then 'user:' || auth.uid() else 'client:' || coalesce(nullif(p_client, ''), 'anon') end;
begin
  insert into public.votes (coin_key, chain, address, name, symbol, voter)
  values (p_chain || ':' || lower(p_address), p_chain, p_address, left(p_name, 80), left(p_symbol, 20), who)
  on conflict (coin_key, voter) do nothing;
  return query select public.coin_votes(p_chain, p_address), true;
end $$;

create or replace function public.hot_spot(p_limit integer default 10)
returns table (chain text, address text, name text, symbol text, logo_url text, votes integer, listing_id text, total integer)
language sql stable security definer set search_path = public as $$
  with coins as (
    select l.chain, l.contract as address, l.project_name as name, l.symbol, l.logo_url, l.id as listing_id
    from public.listings l where l.status = 'approved'
    union
    select distinct on (v.coin_key) v.chain, v.address, v.name, v.symbol, '' as logo_url, null as listing_id
    from public.votes v
    where not exists (select 1 from public.listings l where l.status = 'approved' and l.chain = v.chain and lower(l.contract) = lower(v.address))
  ), scored as (
    select c.*, public.coin_votes(c.chain, c.address) as votes from coins c
  )
  select s.chain, s.address, s.name, s.symbol, s.logo_url, s.votes, s.listing_id,
         (select coalesce(sum(votes), 0) from scored)::int as total
  from scored s where s.votes > 0
  order by s.votes desc
  limit greatest(1, least(p_limit, 25))
$$;

-- ───────────────────────────── Auth hooks ─────────────────────────────
create or replace function public.username_available(p_username text) returns boolean
language sql stable security definer set search_path = public as $$
  select not exists (select 1 from public.profiles where lower(username) = lower(p_username))
$$;

-- New auth user → profile row, and reclaim legacy (migrated) listings by username.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare uname text := coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1));
begin
  insert into public.profiles (id, username, telegram)
  values (new.id, uname, coalesce(new.raw_user_meta_data ->> 'telegram', ''));
  update public.listings set user_id = new.id where user_id is null and lower(username) = lower(uname);
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.admin_users()
returns table (user_id uuid, username text, telegram text, is_admin boolean, created_at timestamptz, listings integer, orders integer)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  return query
    select p.id, p.username, p.telegram, p.is_admin, p.created_at,
           (select count(*) from public.listings l where l.user_id = p.id)::int,
           (select count(*) from public.orders o where o.user_id = p.id)::int
    from public.profiles p order by p.created_at desc;
end $$;

-- ───────────────────────────── Row level security ─────────────────────────────
alter table public.profiles enable row level security;
alter table public.listings enable row level security;
alter table public.tiers enable row level security;
alter table public.settings enable row level security;
alter table public.orders enable row level security;
alter table public.votes enable row level security;   -- no policies: only reachable through the vote RPCs

drop policy if exists "own profile or admin" on public.profiles;
create policy "own profile or admin" on public.profiles for select using (id = auth.uid() or public.is_admin());
drop policy if exists "admin updates profiles" on public.profiles;
create policy "admin updates profiles" on public.profiles for update using (public.is_admin());

drop policy if exists "read listings" on public.listings;
create policy "read listings" on public.listings for select
  using (status = 'approved' or user_id = auth.uid() or public.is_admin());
drop policy if exists "submit listings" on public.listings;
create policy "submit listings" on public.listings for insert to authenticated with check (true);
drop policy if exists "admin edits listings" on public.listings;
create policy "admin edits listings" on public.listings for update using (public.is_admin());
drop policy if exists "admin deletes listings" on public.listings;
create policy "admin deletes listings" on public.listings for delete using (public.is_admin());

drop policy if exists "read tiers" on public.tiers;
create policy "read tiers" on public.tiers for select using (true);
drop policy if exists "admin edits tiers" on public.tiers;
create policy "admin edits tiers" on public.tiers for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "read settings" on public.settings;
create policy "read settings" on public.settings for select using (true);
drop policy if exists "admin edits settings" on public.settings;
create policy "admin edits settings" on public.settings for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "read own orders" on public.orders;
create policy "read own orders" on public.orders for select using (user_id = auth.uid() or public.is_admin());
drop policy if exists "place orders" on public.orders;
create policy "place orders" on public.orders for insert to authenticated with check (true);

grant select on public.active_boosts to anon, authenticated;
grant execute on function public.cast_vote, public.vote_status, public.hot_spot, public.username_available to anon, authenticated;
grant execute on function public.admin_order_action, public.admin_users, public.admin_add_trending to authenticated;
