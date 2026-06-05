alter table public.quiz_questions
  add column if not exists correct_option text not null default 'A';

alter table public.quiz_questions
  drop constraint if exists quiz_questions_correct_option_check;

alter table public.quiz_questions
  add constraint quiz_questions_correct_option_check
  check (correct_option in ('A', 'B', 'C', 'D'));
