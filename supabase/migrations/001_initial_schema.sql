-- QuizMaster Database Schema
-- Run this in your Supabase SQL Editor

-- Quizzes table
create table if not exists quizzes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  created_at timestamp with time zone default now()
);

-- Questions table
create table if not exists questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid references quizzes(id) on delete cascade,
  type text check (type in ('multiple_choice', 'true_false', 'open_text')) not null,
  text text not null,
  options jsonb,
  correct_answer text not null,
  time_limit int default 30,
  points int default 100,
  "order" int not null
);

-- Active game sessions
create table if not exists game_sessions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid references quizzes(id),
  code text unique not null,
  status text default 'lobby' check (status in ('lobby', 'in_progress', 'finished')),
  current_question int default 0,
  created_at timestamp with time zone default now()
);

-- Players in sessions
create table if not exists players (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references game_sessions(id) on delete cascade,
  nickname text not null,
  score int default 0,
  created_at timestamp with time zone default now()
);

-- Player answers
create table if not exists answers (
  id uuid primary key default gen_random_uuid(),
  player_id uuid references players(id) on delete cascade,
  question_id uuid references questions(id),
  answer text,
  time_ms int,
  is_correct boolean,
  points_earned int default 0,
  created_at timestamp with time zone default now()
);

-- Indexes for performance
create index if not exists idx_questions_quiz_id on questions(quiz_id);
create index if not exists idx_questions_order on questions(quiz_id, "order");
create index if not exists idx_game_sessions_code on game_sessions(code);
create index if not exists idx_players_session_id on players(session_id);
create index if not exists idx_answers_player_id on answers(player_id);
create index if not exists idx_answers_question_id on answers(question_id);

-- Enable Row Level Security (optional - for production)
-- alter table quizzes enable row level security;
-- alter table questions enable row level security;
-- alter table game_sessions enable row level security;
-- alter table players enable row level security;
-- alter table answers enable row level security;

-- Enable realtime for game_sessions and players tables
alter publication supabase_realtime add table game_sessions;
alter publication supabase_realtime add table players;

