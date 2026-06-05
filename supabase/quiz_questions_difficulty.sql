alter table public.quiz_questions
  add column if not exists difficulty text not null default 'easy';

alter table public.quiz_questions
  drop constraint if exists quiz_questions_difficulty_check;

alter table public.quiz_questions
  add constraint quiz_questions_difficulty_check
  check (difficulty in ('easy', 'medium', 'hard'));

create index if not exists quiz_questions_topic_difficulty_order_idx
  on public.quiz_questions (topic_slug, difficulty, sort_order);
