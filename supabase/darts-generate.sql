-- Generates missing pairs only. The entire schedule is rolled back if any pair cannot be scheduled.
create or replace function public.darts_generate_matches(p_actor_id bigint, p_competition_id bigint, p_location_id bigint, p_from date, p_to date)
returns integer language plpgsql security definer set search_path=public as $$
declare home_row record; away_row record; home_id bigint; away_id bigint; pref boolean[]; current_day date; slot timestamp; board bigint; next_id bigint; counter integer := 0; created_count integer := 0;
begin
  if not exists(select 1 from darts_players where id=p_actor_id and active and upper(role)='ADMIN') then raise exception 'Generování může spustit jen správce ligy'; end if;
  if p_from is null or p_to is null or p_to<p_from or p_to-p_from>730 then raise exception 'Zadejte platné období nejvýše 730 dní'; end if;
  if not exists(select 1 from darts_competitions where id=p_competition_id) or not exists(select 1 from darts_locations where id=p_location_id and active) then raise exception 'Soutěž nebo hrací místo neexistuje'; end if;
  perform pg_advisory_xact_lock(hashtext('darts_generate_matches'));
  select coalesce(max(id),0) into next_id from darts_matches;
  for home_row in select id,preferred_days from darts_players where active order by id loop
    for away_row in select id,preferred_days from darts_players where active and id>home_row.id order by id loop
      counter := counter + 1;
      if exists(select 1 from darts_matches where competition_id=p_competition_id and ((home_player=home_row.id and away_player=away_row.id) or (home_player=away_row.id and away_player=home_row.id))) then continue; end if;
      if counter % 2 = 1 then home_id:=home_row.id; away_id:=away_row.id; pref:=home_row.preferred_days;
      else home_id:=away_row.id; away_id:=home_row.id; pref:=away_row.preferred_days; end if;
      current_day := p_from; board := null;
      while current_day<=p_to loop
        slot := current_day + time '19:00';
        if coalesce(pref[extract(isodow from current_day)::integer],false)
          and exists(select 1 from darts_opening_hours where location_id=p_location_id and day_of_week=extract(isodow from current_day)::integer and open_time<='19:00' and close_time>'19:00')
          and not exists(select 1 from darts_matches where competition_id=p_competition_id and coalesce(status,'')<>'CANCELLED' and (home_player in (home_id,away_id) or away_player in (home_id,away_id)) and match_date>=date_trunc('week',slot) and match_date<date_trunc('week',slot)+interval '7 days') then
          for board in select b.id from darts_boards b where b.location_id=p_location_id and b.active order by b.id loop
            perform pg_advisory_xact_lock(hashtextextended(board::text || ':' || slot::text,0));
            if not exists(select 1 from darts_blocked_days bd where bd.location_id=p_location_id and (bd.board_id is null or bd.board_id=board) and slot between bd.blocked_from and bd.blocked_to)
              and not exists(select 1 from darts_matches m where m.board_id=board and m.match_date=slot and coalesce(m.status,'')<>'CANCELLED') then exit; end if;
            board := null;
          end loop;
          if board is not null then exit; end if;
        end if;
        current_day := current_day+1;
      end loop;
      if board is null then raise exception 'Pro všechny dvojice se nepodařilo najít volné termíny. Rozšiřte období a zkontrolujte hrací dny hráčů a otevírací dobu.'; end if;
      next_id:=next_id+1;
      insert into darts_matches(id,competition_id,home_player,away_player,match_date,status,location_id,board_id,created) values(next_id,p_competition_id,home_id,away_id,slot,'PLANNED',p_location_id,board,now());
      created_count:=created_count+1;
    end loop;
  end loop;
  return created_count;
end $$;
revoke all on function public.darts_generate_matches(bigint,bigint,bigint,date,date) from public, anon, authenticated;
grant execute on function public.darts_generate_matches(bigint,bigint,bigint,date,date) to service_role;
