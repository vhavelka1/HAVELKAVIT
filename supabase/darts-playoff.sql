create table if not exists public.darts_playoff_seed (
 competition_id bigint not null references public.darts_competitions(id), seed integer not null check(seed between 1 and 12), player_id bigint not null references public.darts_players(id), primary key(competition_id,seed), unique(competition_id,player_id)
);
create table if not exists public.darts_playoff_result (
 competition_id bigint not null references public.darts_competitions(id), match_key text not null check(match_key in ('A','B','C','D','Q1','Q2','Q3','Q4','S1','S2','F','T')), player1 bigint not null references public.darts_players(id), player2 bigint not null references public.darts_players(id), score1 integer not null check(score1 between 0 and 99), score2 integer not null check(score2 between 0 and 99), updated_at timestamptz not null default now(), primary key(competition_id,match_key), check(score1<>score2)
);
alter table public.darts_playoff_seed enable row level security;
alter table public.darts_playoff_result enable row level security;
revoke all on public.darts_playoff_seed,public.darts_playoff_result from anon,authenticated;
grant all on public.darts_playoff_seed,public.darts_playoff_result to service_role;
-- Seed positions copied from the supplied bracket, not inferred from changing standings.
insert into public.darts_playoff_seed(competition_id,seed,player_id) values
(1,1,83),(1,2,85),(1,3,95),(1,4,1),(1,5,91),(1,6,94),(1,7,181),(1,8,84),(1,9,82),(1,10,90),(1,11,201),(1,12,93)
on conflict(competition_id,seed) do nothing;

create or replace function public.darts_save_playoff_result(p_actor bigint,p_competition bigint,p_key text,p_score1 integer,p_score2 integer)
returns void language plpgsql security definer set search_path=public as $$
declare p1 bigint; p2 bigint; r darts_playoff_result%rowtype; deps text[]; source1 text; source2 text; seed1 integer; seed2 integer; use_loser boolean := false;
begin
 if not exists(select 1 from darts_players where id=p_actor and active and upper(role)='ADMIN') then raise exception 'Výsledky play-off může upravovat jen správce ligy'; end if;
 perform pg_advisory_xact_lock(hashtextextended('playoff:'||p_competition::text,0));
 case p_key
  when 'A' then seed1:=5; seed2:=12; deps:=array['Q2','S1','F','T'];
  when 'B' then seed1:=8; seed2:=9; deps:=array['Q1','S1','F','T'];
  when 'C' then seed1:=6; seed2:=11; deps:=array['Q3','S2','F','T'];
  when 'D' then seed1:=7; seed2:=10; deps:=array['Q4','S2','F','T'];
  when 'Q1' then seed1:=1; source2:='B'; deps:=array['S1','F','T'];
  when 'Q2' then seed1:=4; source2:='A'; deps:=array['S1','F','T'];
  when 'Q3' then seed1:=3; source2:='C'; deps:=array['S2','F','T'];
  when 'Q4' then seed1:=2; source2:='D'; deps:=array['S2','F','T'];
  when 'S1' then source1:='Q1'; source2:='Q2'; deps:=array['F','T'];
  when 'S2' then source1:='Q3'; source2:='Q4'; deps:=array['F','T'];
  when 'F' then source1:='S1'; source2:='S2'; deps:=array[]::text[];
  when 'T' then source1:='S1'; source2:='S2'; use_loser:=true; deps:=array[]::text[];
  else raise exception 'Neplatný zápas play-off';
 end case;
 if exists(select 1 from darts_playoff_result where competition_id=p_competition and match_key=any(deps)) then raise exception 'Nejprve smažte výsledky navazujících zápasů.'; end if;
 if p_score1 is null and p_score2 is null then delete from darts_playoff_result where competition_id=p_competition and match_key=p_key; return; end if;
 if p_score1 is null or p_score2 is null or p_score1<0 or p_score2<0 or p_score1>99 or p_score2>99 or p_score1=p_score2 then raise exception 'Zadejte dvě různá skóre od 0 do 99.'; end if;
 if seed1 is not null then select player_id into p1 from darts_playoff_seed where competition_id=p_competition and seed=seed1;
 else select case when (score1>score2) <> use_loser then player1 else player2 end into p1 from darts_playoff_result where competition_id=p_competition and match_key=source1; end if;
 if seed2 is not null then select player_id into p2 from darts_playoff_seed where competition_id=p_competition and seed=seed2;
 else select case when (score1>score2) <> use_loser then player1 else player2 end into p2 from darts_playoff_result where competition_id=p_competition and match_key=source2; end if;
 if p1 is null or p2 is null then raise exception 'Nejprve vyplňte výsledky předchozích zápasů.'; end if;
 insert into darts_playoff_result(competition_id,match_key,player1,player2,score1,score2) values(p_competition,p_key,p1,p2,p_score1,p_score2)
 on conflict(competition_id,match_key) do update set player1=excluded.player1,player2=excluded.player2,score1=excluded.score1,score2=excluded.score2,updated_at=now();
end $$;
revoke all on function public.darts_save_playoff_result(bigint,bigint,text,integer,integer) from public,anon,authenticated;
grant execute on function public.darts_save_playoff_result(bigint,bigint,text,integer,integer) to service_role;
