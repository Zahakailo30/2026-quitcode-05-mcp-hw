-- LeadDesk: leads table for WS5 (Task B). Columns follow materials/leads.json;
-- status is limited to LEAD_STATUSES from lib/types.ts, id to the leadId() format from lib/db.ts.
create table if not exists public.leads (
  id          text primary key check (id ~ '^lead_[0-9]{4}$'),
  full_name   text not null,
  company     text not null,
  email       text not null,
  source      text not null,
  status      text not null default 'new'
              check (status in ('new', 'contacted', 'qualified', 'won', 'lost')),
  budget      integer check (budget is null or budget >= 0),
  message     text not null default '',
  created_at  timestamptz not null
);

create index if not exists leads_status_created_at_idx on public.leads (status, created_at desc);

-- No policies: with RLS on, the anon and authenticated roles see nothing through the Data API.
alter table public.leads enable row level security;
