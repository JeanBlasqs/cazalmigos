create extension if not exists "pgcrypto";

alter table players
  add column if not exists chips int not null default 10,
  add column if not exists reconnect_token uuid not null default gen_random_uuid(),
  add column if not exists avatar text,
  add column if not exists ready boolean not null default false;

alter table games
  add column if not exists team_a_position int not null default 0,
  add column if not exists team_b_position int not null default 0,
  add column if not exists board_size int not null default 50,
  add column if not exists current_question_id uuid,
  add column if not exists player_1_id uuid,
  add column if not exists player_2_id uuid,
  add column if not exists bet_1 int,
  add column if not exists bet_2 int,
  add column if not exists answer_1 text,
  add column if not exists answer_2 text,
  add column if not exists answer_1_at timestamptz,
  add column if not exists answer_2_at timestamptz,
  add column if not exists winner_team text,
  add column if not exists skip_team text,
  add column if not exists version int not null default 0,
  add column if not exists updated_at timestamptz not null default now();

alter table moves
  add column if not exists team text,
  add column if not exists question_id uuid,
  add column if not exists player_1_id uuid,
  add column if not exists player_2_id uuid,
  add column if not exists bet_1 int,
  add column if not exists bet_2 int,
  add column if not exists answer_1 text,
  add column if not exists answer_2 text,
  add column if not exists correct boolean,
  add column if not exists spaces_moved int not null default 0,
  add column if not exists special_effect text;

alter table games drop column if exists team_a_chips;
alter table games drop column if exists team_b_chips;

update players set chips = 10 where chips is null;
update games set team_a_position = least(greatest(coalesce(team_a_position, 0), 0), 50);
update games set team_b_position = least(greatest(coalesce(team_b_position, 0), 0), 50);

create index if not exists players_room_id_idx on players(room_id);
create index if not exists players_reconnect_token_idx on players(reconnect_token);
create index if not exists games_room_id_idx on games(room_id);
create index if not exists moves_game_id_created_at_idx on moves(game_id, created_at desc);

create table if not exists question_bank (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  category text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists room_question_selections (
  room_id uuid not null references rooms(id) on delete cascade,
  question_bank_id uuid not null references question_bank(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (room_id, question_bank_id)
);

alter table question_bank enable row level security;
alter table room_question_selections enable row level security;

drop policy if exists "public read question_bank" on question_bank;
drop policy if exists "public read room_question_selections" on room_question_selections;
create policy "public read question_bank" on question_bank for select using (true);
create policy "public read room_question_selections" on room_question_selections for select using (true);

insert into question_bank (question, category, active)
select question, 'base', true
from (
  values
    ('Qual cidade combina mais com a nossa proxima viagem?'),
    ('Qual comida pediriamos numa sexta a noite?'),
    ('Qual filme veriamos de novo sem reclamar?'),
    ('Qual palavra descreve melhor o nosso casal?'),
    ('Qual lugar da casa tem mais a nossa cara?')
) seed(question)
where not exists (select 1 from question_bank);

alter table public.games
  drop constraint if exists games_status_check;

alter table public.games
  add constraint games_status_check
  check (status in ('aguardando', 'aguardando_respostas', 'revelada', 'finalizado'));

alter table public.games
  drop constraint if exists games_team_a_position_check;

alter table public.games
  add constraint games_team_a_position_check
  check (team_a_position between 0 and 50);

alter table public.games
  drop constraint if exists games_team_b_position_check;

alter table public.games
  add constraint games_team_b_position_check
  check (team_b_position between 0 and 50);

notify pgrst, 'reload schema';
