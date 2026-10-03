create table if not exists bids (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 60),
  url text not null,
  url_key text not null,
  amount_paise bigint not null check (amount_paise >= 1000),
  status text not null default 'pending' check (status in ('pending','paid')),
  order_id text unique not null,
  payment_id text,
  created_at timestamptz not null default now()
);
create index if not exists bids_paid_idx on bids (status, url_key);
alter table bids enable row level security;  -- no policies: only the server (service role) can access

create or replace view leaderboard as
select url_key,
       (array_agg(name order by created_at desc))[1] as name,
       (array_agg(url  order by created_at desc))[1] as url,
       sum(amount_paise) as total_paise,
       min(created_at) as first_bid_at
from bids where status = 'paid'
group by url_key
order by total_paise desc, first_bid_at asc;
revoke all on leaderboard from anon, authenticated;
