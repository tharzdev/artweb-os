begin;

create table if not exists public.users (
  id text primary key,
  name text not null,
  email text not null unique,
  password_hash text not null,
  password_salt text not null,
  created_at timestamptz not null
);

create table if not exists public.sessions (
  id text primary key,
  user_id text not null references public.users(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null
);
create index if not exists sessions_user_id_idx on public.sessions(user_id);
create index if not exists sessions_expires_at_idx on public.sessions(expires_at);

create table if not exists public.workspace_state (
  owner_id text primary key references public.users(id) on delete cascade,
  data text not null,
  updated_at timestamptz not null
);

create table if not exists public.ai_credentials (
  owner_id text not null references public.users(id) on delete cascade,
  provider text not null,
  ciphertext text not null,
  iv text not null,
  last_four text not null,
  model text not null,
  endpoint text,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  primary key (owner_id, provider)
);

create table if not exists public.ai_conversations (
  id text primary key,
  owner_id text not null references public.users(id) on delete cascade,
  title text not null,
  provider text not null,
  model text not null,
  pinned integer not null default 0 check (pinned in (0, 1)),
  created_at timestamptz not null,
  updated_at timestamptz not null
);
create index if not exists ai_conversations_owner_updated_idx on public.ai_conversations(owner_id, updated_at desc);

create table if not exists public.ai_messages (
  id text primary key,
  conversation_id text not null references public.ai_conversations(id) on delete cascade,
  owner_id text not null references public.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  sources text not null default '[]',
  created_at timestamptz not null
);
create index if not exists ai_messages_conversation_created_idx on public.ai_messages(conversation_id, created_at);
create index if not exists ai_messages_owner_idx on public.ai_messages(owner_id);

create table if not exists public.prospecting_credentials (
  owner_id text primary key references public.users(id) on delete cascade,
  ciphertext text not null,
  iv text not null,
  last_four text not null,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create table if not exists public.prospecting_searches (
  id text primary key,
  owner_id text not null references public.users(id) on delete cascade,
  category text not null,
  location text not null,
  min_rating double precision not null,
  min_reviews integer not null,
  result_count integer not null default 0,
  created_at timestamptz not null
);
create index if not exists prospecting_searches_owner_created_idx on public.prospecting_searches(owner_id, created_at desc);

alter table public.users enable row level security;
alter table public.sessions enable row level security;
alter table public.workspace_state enable row level security;
alter table public.ai_credentials enable row level security;
alter table public.ai_conversations enable row level security;
alter table public.ai_messages enable row level security;
alter table public.prospecting_credentials enable row level security;
alter table public.prospecting_searches enable row level security;

revoke all on table public.users from anon, authenticated;
revoke all on table public.sessions from anon, authenticated;
revoke all on table public.workspace_state from anon, authenticated;
revoke all on table public.ai_credentials from anon, authenticated;
revoke all on table public.ai_conversations from anon, authenticated;
revoke all on table public.ai_messages from anon, authenticated;
revoke all on table public.prospecting_credentials from anon, authenticated;
revoke all on table public.prospecting_searches from anon, authenticated;

commit;
