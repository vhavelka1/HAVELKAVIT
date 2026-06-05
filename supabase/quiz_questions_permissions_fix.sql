grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.quiz_questions to anon, authenticated;
grant usage, select on sequence public.quiz_questions_id_seq to anon, authenticated;

alter table public.quiz_questions enable row level security;

drop policy if exists "Allow public read quiz questions" on public.quiz_questions;
drop policy if exists "Allow public insert quiz questions" on public.quiz_questions;
drop policy if exists "Allow public update quiz questions" on public.quiz_questions;
drop policy if exists "Allow public delete quiz questions" on public.quiz_questions;

create policy "Allow public read quiz questions"
  on public.quiz_questions for select
  using (true);

create policy "Allow public insert quiz questions"
  on public.quiz_questions for insert
  with check (true);

create policy "Allow public update quiz questions"
  on public.quiz_questions for update
  using (true)
  with check (true);

create policy "Allow public delete quiz questions"
  on public.quiz_questions for delete
  using (true);
