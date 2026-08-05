create extension if not exists "pgcrypto";

create type room_status as enum ('aguardando', 'em_andamento', 'finalizado');
create type game_status as enum ('aguardando', 'aguardando_respostas', 'validando_respostas', 'revelada', 'finalizado');
create type team_name as enum ('a', 'b');

create table rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  status room_status not null default 'aguardando',
  host_player_id uuid,
  max_players int not null default 4,
  created_at timestamptz not null default now()
);

create table players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  name text not null,
  team team_name,
  is_host boolean not null default false,
  connected boolean not null default true,
  chips int not null default 10 check (chips between 1 and 10),
  reconnect_token uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now()
);

alter table rooms
  add constraint rooms_host_player_id_fkey
  foreign key (host_player_id) references players(id) on delete set null;

create table questions (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  question text not null,
  mode text not null default 'comparativa' check (mode = 'comparativa'),
  category text,
  created_at timestamptz not null default now()
);

create table games (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null unique references rooms(id) on delete cascade,
  status game_status not null default 'aguardando',
  current_team team_name not null default 'a',
  team_a_position int not null default 0 check (team_a_position between 0 and 50),
  team_b_position int not null default 0 check (team_b_position between 0 and 50),
  board_size int not null default 50,
  current_question_id uuid references questions(id) on delete set null,
  player_1_id uuid references players(id) on delete set null,
  player_2_id uuid references players(id) on delete set null,
  bet_1 int check (bet_1 between 1 and 10),
  bet_2 int check (bet_2 between 1 and 10),
  answer_1 text,
  answer_2 text,
  answer_1_at timestamptz,
  answer_2_at timestamptz,
  validation_1 boolean,
  validation_2 boolean,
  validation_1_at timestamptz,
  validation_2_at timestamptz,
  winner_team team_name,
  version int not null default 0,
  updated_at timestamptz not null default now()
);

create table moves (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references games(id) on delete cascade,
  team team_name not null,
  question_id uuid references questions(id) on delete set null,
  player_1_id uuid not null references players(id) on delete cascade,
  player_2_id uuid not null references players(id) on delete cascade,
  bet_1 int not null,
  bet_2 int not null,
  answer_1 text not null,
  answer_2 text not null,
  correct boolean not null,
  spaces_moved int not null default 0,
  created_at timestamptz not null default now()
);

alter table rooms enable row level security;
alter table players enable row level security;
alter table questions enable row level security;
alter table games enable row level security;
alter table moves enable row level security;

create policy "public read rooms" on rooms for select using (true);
create policy "public read players" on players for select using (true);
create policy "public read questions" on questions for select using (true);
create policy "public read games" on games for select using (true);
create policy "public read moves" on moves for select using (true);

create index players_room_id_idx on players(room_id);
create index players_reconnect_token_idx on players(reconnect_token);
create index games_room_id_idx on games(room_id);
create index moves_game_id_created_at_idx on moves(game_id, created_at desc);
