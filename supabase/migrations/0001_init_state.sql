-- ============================================================
-- DeFi Cockpit — initial state schema
-- Watchlist + multi-wallet + token price cache
-- ============================================================
--
-- Apply via Supabase Dashboard → SQL Editor (one shot).
-- All tables use wallet address as the identity column for now;
-- upgrade to wallet-signed auth later by joining on auth.users.

-- ── Watchlist ─────────────────────────────────────────────────

create table if not exists public.watchlist (
  id uuid primary key default gen_random_uuid(),
  wallet_address text not null,
  mint text not null,
  symbol text,
  added_at timestamptz not null default now(),
  unique (wallet_address, mint)
);

create index if not exists watchlist_wallet_idx on public.watchlist (wallet_address);

-- ── User wallets (multi-wallet support) ───────────────────────

create table if not exists public.user_wallets (
  id uuid primary key default gen_random_uuid(),
  owner_address text not null,         -- the "primary" / signing wallet
  wallet_address text not null,        -- a wallet linked under the owner
  label text,                          -- user-given nickname
  is_primary boolean not null default false,
  added_at timestamptz not null default now(),
  unique (owner_address, wallet_address)
);

create index if not exists user_wallets_owner_idx on public.user_wallets (owner_address);

-- ── Token price cache (chart data persistence) ────────────────

create table if not exists public.token_price_cache (
  mint text not null,
  window_days int not null,
  source text not null,                -- 'binance' | 'birdeye' | 'geckoterminal'
  payload jsonb not null,              -- TokenChartPoint[] serialized
  cached_at timestamptz not null default now(),
  primary key (mint, window_days)
);

-- Auto-refresh helper: rows older than 1h should be considered stale
create index if not exists token_price_cache_age_idx on public.token_price_cache (cached_at);

-- ── Row-Level Security ────────────────────────────────────────
--
-- Anon key has full read/write access for now (wallet address is
-- the only identifier — the app filters by wallet client-side).
-- Tighten to wallet-signed auth later.

alter table public.watchlist        enable row level security;
alter table public.user_wallets     enable row level security;
alter table public.token_price_cache enable row level security;

-- Allow anon reads on everything
create policy "anon read watchlist"
  on public.watchlist for select using (true);
create policy "anon read user_wallets"
  on public.user_wallets for select using (true);
create policy "anon read price_cache"
  on public.token_price_cache for select using (true);

-- Allow anon writes (will harden once we add wallet-signature auth)
create policy "anon write watchlist"
  on public.watchlist for insert with check (true);
create policy "anon delete watchlist"
  on public.watchlist for delete using (true);

create policy "anon write user_wallets"
  on public.user_wallets for insert with check (true);
create policy "anon delete user_wallets"
  on public.user_wallets for delete using (true);

create policy "anon upsert price_cache"
  on public.token_price_cache for insert with check (true);
create policy "anon update price_cache"
  on public.token_price_cache for update using (true);
