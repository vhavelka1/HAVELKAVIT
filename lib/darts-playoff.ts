import "server-only";
import { getSupabaseAdminClient } from "@/lib/site-settings";
export type PlayoffSeed={competition_id:number;seed:number;player_id:number};
export type PlayoffResult={competition_id:number;match_key:string;player1:number;player2:number;score1:number;score2:number};
export async function getPlayoffData(): Promise<{seeds:PlayoffSeed[];results:PlayoffResult[]}> {
 const db=getSupabaseAdminClient(); if(!db) return {seeds:[],results:[]};
 const [seeds,results]=await Promise.all([db.from("darts_playoff_seed").select("competition_id,seed,player_id").order("seed"),db.from("darts_playoff_result").select("competition_id,match_key,player1,player2,score1,score2")]);
 if(seeds.error || results.error) { console.error("Play-off data could not be loaded"); return {seeds:[],results:[]}; }
 return {seeds:seeds.data||[],results:results.data||[]};
}
