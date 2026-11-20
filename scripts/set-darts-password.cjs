/* eslint-disable @typescript-eslint/no-require-imports */
// Set a league password without placing it on the command line.
// Set DARTS_PLAYER_ID and DARTS_INITIAL_PASSWORD in the environment, then run node scripts/set-darts-password.cjs.
const fs=require('fs'); const crypto=require('crypto'); const {createClient}=require('@supabase/supabase-js');
for(const line of fs.readFileSync('.env.local','utf8').split(/\r?\n/)){const m=line.match(/^\s*([A-Za-z_][\w]*)=(.*)$/);if(m&&!process.env[m[1]])process.env[m[1]]=m[2].trim().replace(/^['"]|['"]$/g,'')}
const id=Number(process.env.DARTS_PLAYER_ID), password=process.env.DARTS_INITIAL_PASSWORD;
if(!Number.isSafeInteger(id)||id<1||!password||password.length<6) throw Error('Nastavte DARTS_PLAYER_ID a DARTS_INITIAL_PASSWORD (alespoň 6 znaků).');
const salt=crypto.randomBytes(16).toString('hex'); const hash=salt+':'+crypto.scryptSync(password,salt,64).toString('hex');
const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false}});
(async()=>{const {error}=await db.from('darts_accounts').upsert({player_id:id,password_hash:hash,failed_attempts:0,locked_until:null});if(error)throw error;const result=await db.from('darts_sessions').delete().eq('player_id',id);if(result.error)throw result.error;console.log('Heslo nastaveno a předchozí relace ukončeny.');})().catch(e=>{console.error(e.message);process.exitCode=1});
