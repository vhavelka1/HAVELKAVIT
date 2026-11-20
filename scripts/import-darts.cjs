/* eslint-disable @typescript-eslint/no-require-imports */
// Run once after applying supabase/darts.sql. Reads private Oracle exports locally.
const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");
for (const line of fs.readFileSync(".env.local", "utf8").split(/\r?\n/)) { const m = line.match(/^\s*([A-Za-z_][\w]*)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^['"]|['"]$/g, ""); }
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error("Chybí konfigurace Supabase v .env.local");
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {auth:{persistSession:false}});
function read(name) {
 const s=fs.readFileSync(path.join("exporty hrusovanske ligy",name+".txt"),"utf8").replace(/^\uFEFF/,""); let rows=[],row=[],field="",q=false;
 for(let i=0;i<s.length;i++){const c=s[i];if(c==='"'){if(q&&s[i+1]==='"'){field+='"';i++}else q=!q}else if(c===','&&!q){row.push(field);field=''}else if((c==='\n'||c==='\r')&&!q){if(c==='\r'&&s[i+1]==='\n')i++;row.push(field);if(row.some(Boolean))rows.push(row);row=[];field=''}else field+=c}if(row.length||field){row.push(field);rows.push(row)}const keys=rows.shift();return rows.map(r=>Object.fromEntries(keys.map((k,i)=>[k,r[i]||''])));
}
const n=v=>v ? Number(v) : null, v=x=>x || null, day=x=>x ? x.slice(0,10) : null;
const tasks=[
 ["darts_players",read("players").map(x=>({id:n(x.PLAYER_ID),name:x.PLAYER_NAME,email:x.EMAIL ? x.EMAIL.trim().toLowerCase() : null,active:x.STATUS==='T',role:(x.ROLE||'PLAYER').toUpperCase(),phone:v(x.PHONE),birth_date:day(x.BIRTH_DATE),preferred_days:['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY'].map(d=>x['PREF_'+d]==='Y')}))],
 ["darts_competitions",read("competitions").map(x=>({id:n(x.COMP_ID),name:x.COMP_NAME,start_date:day(x.START_DATE),end_date:day(x.END_DATE),active:x.ACTIVE==='Y'}))],
 ["darts_locations",read("locations").map(x=>({id:n(x.LOCATION_ID),name:x.NAME,address:v(x.ADDRESS),city:v(x.CITY),active:x.ACTIVE!=='F'}))],
 ["darts_boards",read("boards").map(x=>({id:n(x.BOARD_ID),location_id:n(x.LOCATION_ID),name:x.BOARD_NAME,active:x.ACTIVE!=='N'}))],
 ["darts_opening_hours",read("location_opening_hours").map(x=>({id:n(x.Id||x.ID),location_id:n(x.LOCATION_ID),day_of_week:n(x.DAY_OF_WEEK),open_time:v(x.OPEN_TIME),close_time:v(x.CLOSE_TIME)}))],
 ["darts_blocked_days",read("blocked_days").map(x=>({id:n(x.Id||x.ID),location_id:n(x.LOCATION_ID),board_id:n(x.BOARD_ID),blocked_from:v(x.BLOCKED_FROM),blocked_to:v(x.BLOCKED_TO),reason:v(x.REASON)}))],
 ["darts_matches",read("matches").map(x=>({id:n(x.Id||x.ID),competition_id:n(x.COMP_ID),home_player:n(x.HOME_PLAYER),away_player:n(x.AWAY_PLAYER),match_date:v(x.MATCH_DATE),status:v(x.STATUS),approved_home:x.APPROVED_HOME==='Y',approved_away:x.APPROVED_AWAY==='Y',score:v(x.SCORE),board_id:n(x.BOARD_ID),location_id:n(x.LOCATION),proposed_date:v(x.PROPOSED_DATE),comment_home:v(x.COMMENT_HOME),comment_away:v(x.COMMENT_AWAY),created:v(x.CREATED)}))],
 ["darts_match_log",read("match_date_log").map(x=>({id:n(x.ID||x.Id),match_id:n(x.MATCH_ID),change_type:v(x.CHANGE_TYPE),old_value:v(x.OLD_VALUE),new_value:v(x.NEW_VALUE),old_text_value:v(x.OLD_TEXT_VALUE),new_text_value:v(x.NEW_TEXT_VALUE),changed_by:v(x.CHANGED_BY),changed_at:v(x.CHANGED_AT)}))],
];
(async()=>{for(const [table,rows] of tasks){for(let i=0;i<rows.length;i+=100){const {error}=await db.from(table).upsert(rows.slice(i,i+100), {onConflict:"id",ignoreDuplicates:true});if(error) throw new Error(`${table}: ${error.message}`)}console.log(`${table}: ${rows.length} řádků`)}const synced=await db.rpc('darts_sync_log_sequence');if(synced.error)throw synced.error;console.log('Import dokončen.');})().catch(e=>{console.error(e.message);process.exitCode=1});
