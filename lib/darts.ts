import { getSupabaseAdminClient } from "@/lib/site-settings";
import snapshot from "@/lib/league-data.json";

export type LeagueData = typeof snapshot;
/** Return a public projection only; contact details never leave the server. */
export async function getLeagueData(): Promise<{ data: LeagueData; live: boolean }> {
  const db = getSupabaseAdminClient();
  if (!db) return { data: snapshot, live: false };
  const [players, competitions, matches, locations, boards] = await Promise.all([
    db.from("darts_players").select("id,name,active").order("id"),
    db.from("darts_competitions").select("id,name,start_date,end_date,active").order("id"),
    db.from("darts_matches").select("id,competition_id,home_player,away_player,match_date,status,score,board_id,location_id").order("id"),
    db.from("darts_locations").select("id,name,address,city").order("id"),
    db.from("darts_boards").select("id,location_id,name").order("id"),
  ]);
  if ([players, competitions, matches, locations, boards].some(r => r.error)) return { data: snapshot, live: false };
  const str = (v: unknown) => v == null ? "" : String(v);
  return { live: true, data: {
    players: (players.data || []).map(p => ({ PLAYER_ID: str(p.id), PLAYER_NAME: p.name, STATUS: p.active ? "T" : "F" })),
    competitions: (competitions.data || []).map(c => ({ COMP_ID: str(c.id), COMP_NAME: c.name, START_DATE: str(c.start_date), END_DATE: str(c.end_date), ACTIVE: c.active ? "Y" : "N" })),
    matches: (matches.data || []).map(m => ({ Id: str(m.id), COMP_ID: str(m.competition_id), HOME_PLAYER: str(m.home_player), AWAY_PLAYER: str(m.away_player), MATCH_DATE: str(m.match_date), STATUS: str(m.status), SCORE: str(m.score), BOARD_ID: str(m.board_id), LOCATION: str(m.location_id) })),
    locations: (locations.data || []).map(l => ({ LOCATION_ID: str(l.id), NAME: l.name, ADDRESS: str(l.address), CITY: str(l.city) })),
    boards: (boards.data || []).map(b => ({ BOARD_ID: str(b.id), LOCATION_ID: str(b.location_id), BOARD_NAME: str(b.name) })),
  }};
}
