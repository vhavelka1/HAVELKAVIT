"use server";
import { redirect } from "next/navigation";
import { randomBytes, scryptSync } from "node:crypto";
import { revalidatePath } from "next/cache";
import { authenticateDarts, clearDartsSession, currentDartsPlayer, changeDartsPassword } from "@/lib/darts-auth";
import { getSupabaseAdminClient } from "@/lib/site-settings";
const base="/sipky/hrusovanska-liga";
export async function login(form: FormData) {
  const ok=await authenticateDarts(String(form.get("email")||""),String(form.get("password")||""));
  if (!ok) redirect(`${base}/prihlaseni?error=1`);
  redirect(base);
}
export async function logout() { await clearDartsSession(); redirect(base); }
export async function updateMatch(form: FormData) {
  const player=await currentDartsPlayer(); const db=getSupabaseAdminClient();
  if(!player || !db) redirect(`${base}/prihlaseni`);
  const id=Number(form.get("id")); if(!Number.isSafeInteger(id)||id<1) throw new Error("Neplatný zápas");
  const action=String(form.get("action")||"save"), date=String(form.get("date")||""), board=String(form.get("board")||""), score=String(form.get("score")||"");
  if(date && !/^\d{4}-\d\d-\d\dT\d\d:\d\d$/.test(date)) redirect(`${base}/zapas/${id}?error=datum`);
  if(board && !/^\d+$/.test(board)) redirect(`${base}/zapas/${id}?error=terc`);
  const {error}=await db.rpc("darts_update_match",{p_match_id:id,p_actor_id:player.id,p_date:date||null,p_board:board?Number(board):null,p_score:score||null,p_action:action});
  if(error) redirect(`${base}/zapas/${id}?error=${encodeURIComponent(error.message)}`);
  revalidatePath(base); revalidatePath(`${base}/zapas/${id}`); redirect(`${base}/zapas/${id}?saved=1`);
}
export async function saveProfile(form: FormData) {
 const player=await currentDartsPlayer(); const db=getSupabaseAdminClient(); if(!player || !db) redirect(`${base}/prihlaseni`);
 const phone=String(form.get("phone")||"").trim(); if(phone.length>30) redirect(`${base}/profil?error=telefon`);
 const preferred_days=Array.from({length:7},(_,i)=>form.has(`day${i}`));
 const {error}=await db.from("darts_players").update({phone:phone||null,preferred_days}).eq("id",player.id);
 if(error) redirect(`${base}/profil?error=ulozeni`); redirect(`${base}/profil?saved=1`);
}
export async function changePassword(form: FormData) {
 const player=await currentDartsPlayer(); if(!player) redirect(`${base}/prihlaseni`);
 const oldPassword=String(form.get("old_password")||""), password=String(form.get("password")||""), confirm=String(form.get("confirm")||"");
 if(password!==confirm || !await changeDartsPassword(player.id,oldPassword,password)) redirect(`${base}/profil?error=heslo`);
 redirect(`${base}/prihlaseni?changed=1`);
}
export async function saveLeaguePlayer(form: FormData) {
 const actor=await currentDartsPlayer(), db=getSupabaseAdminClient(); if(!actor || !db || actor.role.toUpperCase()!=="ADMIN") redirect(`${base}/prihlaseni`);
 const id=Number(form.get("id")); const name=String(form.get("name")||"").trim(); const email=String(form.get("email")||"").trim().toLowerCase();
 const role=String(form.get("role")||""); const active=form.has("active");
 if(!Number.isSafeInteger(id) || id<1 || !name || name.length>100 || email.length>150 || (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) || !["ADMIN","PLAYER"].includes(role) || (id===actor.id && (!active || role!=="ADMIN"))) redirect(`${base}/sprava?error=udaje`);
 const {error}=await db.from("darts_players").update({name,email:email||null,role,active}).eq("id",id);
 if(error) redirect(`${base}/sprava?error=ulozeni`);
 revalidatePath(base); redirect(`${base}/sprava?saved=1`);
}
export async function setLeaguePlayerPassword(form: FormData) {
 const actor=await currentDartsPlayer(), db=getSupabaseAdminClient(); if(!actor || !db || actor.role.toUpperCase()!=="ADMIN") redirect(`${base}/prihlaseni`);
 const id=Number(form.get("id")), password=String(form.get("password")||"");
 if(!Number.isSafeInteger(id)||id<1||password.length<6||password.length>512) redirect(`${base}/sprava?error=heslo`);
 const salt=randomBytes(16).toString("hex"), password_hash=`${salt}:${scryptSync(password,salt,64).toString("hex")}`;
 const {error}=await db.from("darts_accounts").upsert({player_id:id,password_hash,failed_attempts:0,locked_until:null});
 if(error) redirect(`${base}/sprava?error=ulozeni`);
 await db.from("darts_sessions").delete().eq("player_id",id);
 if(id===actor.id) { await clearDartsSession(); redirect(`${base}/prihlaseni?changed=1`); }
 redirect(`${base}/sprava?saved=1`);
}
export async function generateLeagueMatches(form: FormData) {
 const actor=await currentDartsPlayer(), db=getSupabaseAdminClient(); if(!actor || !db || actor.role.toUpperCase()!=="ADMIN") redirect(`${base}/prihlaseni`);
 const competition=Number(form.get("competition")), location=Number(form.get("location")), from=String(form.get("from")||""), to=String(form.get("to")||"");
 if(!Number.isSafeInteger(competition)||competition<1||!Number.isSafeInteger(location)||location<1||!/^\d{4}-\d{2}-\d{2}$/.test(from)||!/^\d{4}-\d{2}-\d{2}$/.test(to)) redirect(`${base}/sprava?generate_error=Neplatné%20zadání`);
 const {data,error}=await db.rpc("darts_generate_matches",{p_actor_id:actor.id,p_competition_id:competition,p_location_id:location,p_from:from,p_to:to});
 if(error) redirect(`${base}/sprava?generate_error=${encodeURIComponent(error.message)}`);
 revalidatePath(base); redirect(`${base}/sprava?generated=${Number(data)}`);
}
export async function savePlayoffResult(form: FormData) {
 const actor=await currentDartsPlayer(), db=getSupabaseAdminClient(); if(!actor || !db || actor.role.toUpperCase()!=="ADMIN") redirect(`${base}/prihlaseni`);
 const competition=Number(form.get("competition")), key=String(form.get("match")||""), action=String(form.get("operation")||"save");
 if(!Number.isSafeInteger(competition)||competition<1||!['A','B','C','D','Q1','Q2','Q3','Q4','S1','S2','F','T'].includes(key)||!['save','clear'].includes(action)) redirect(`${base}?playoff_error=Neplatn%C3%A9%20zad%C3%A1n%C3%AD#playoff`);
 const s1=String(form.get("score1")||""), s2=String(form.get("score2")||"");
 if(action==='save' && (!/^\d{1,2}$/.test(s1)||!/^\d{1,2}$/.test(s2))) redirect(`${base}?playoff_error=Zadejte%20ob%C4%9B%20sk%C3%B3re#playoff`);
 const {error}=await db.rpc('darts_save_playoff_result',{p_actor:actor.id,p_competition:competition,p_key:key,p_score1:action==='clear'?null:Number(s1),p_score2:action==='clear'?null:Number(s2)});
 if(error) redirect(`${base}?playoff_error=${encodeURIComponent(error.message)}#playoff`);
 revalidatePath(base); redirect(`${base}?playoff_saved=1#playoff`);
}
