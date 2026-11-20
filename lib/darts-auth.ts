import "server-only";
import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { getSupabaseAdminClient } from "@/lib/site-settings";

const cookieName = "darts_session";
const hash = (value: string) => createHash("sha256").update(value).digest("hex");
export async function currentDartsPlayer() {
  const db = getSupabaseAdminClient(); const token = (await cookies()).get(cookieName)?.value;
  if (!db || !token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const { data: session } = await db.from("darts_sessions").select("player_id,expires_at").eq("token_hash",hash(token)).gt("expires_at",new Date().toISOString()).maybeSingle();
  if (!session) return null;
  const { data: player } = await db.from("darts_players").select("id,name,role,active").eq("id",session.player_id).eq("active",true).maybeSingle();
  return player as {id:number;name:string;role:string;active:boolean} | null;
}
export async function authenticateDarts(email: string, password: string) {
  const db=getSupabaseAdminClient(); if (!db || !email || !password || email.length > 255 || password.length > 512) return false;
  const {data: player}=await db.from("darts_players").select("id,active").eq("email",email.trim().toLowerCase()).eq("active",true).maybeSingle();
  const {data: account}=player ? await db.from("darts_accounts").select("password_hash,failed_attempts,locked_until").eq("player_id",player.id).maybeSingle() : {data:null};
  if (account?.locked_until && new Date(account.locked_until).getTime() > Date.now()) return false;
  // Always perform a password derivation, including for unknown email addresses.
  const [salt, expected] = (account?.password_hash || `${"0".repeat(32)}:${"0".repeat(128)}`).split(":");
  const actual=scryptSync(password,salt,64); const expectedBytes=Buffer.from(expected || "", "hex");
  const valid=expectedBytes.length===actual.length && timingSafeEqual(actual,expectedBytes);
  if (!player || !account || !valid) {
    if (player && account) { const attempts=(account.failed_attempts || 0)+1; await db.from("darts_accounts").update({failed_attempts:attempts,locked_until:attempts>=5 ? new Date(Date.now()+15*60*1000).toISOString() : null}).eq("player_id",player.id); }
    return false;
  }
  await db.from("darts_accounts").update({failed_attempts:0,locked_until:null}).eq("player_id",player.id);
  const token=randomBytes(32).toString("hex"); const expires=new Date(Date.now()+7*86400000);
  const {error}=await db.from("darts_sessions").insert({token_hash:hash(token),player_id:player.id,expires_at:expires.toISOString()}); if(error) return false;
  (await cookies()).set(cookieName,token,{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/sipky/hrusovanska-liga",expires});
  return true;
}
export async function clearDartsSession() {
  const store=await cookies(); const token=store.get(cookieName)?.value; const db=getSupabaseAdminClient();
  if(token && db) await db.from("darts_sessions").delete().eq("token_hash",hash(token));
  store.set(cookieName,"",{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/sipky/hrusovanska-liga",maxAge:0});
}
export async function changeDartsPassword(playerId: number, oldPassword: string, newPassword: string) {
  const db=getSupabaseAdminClient();
  if (!db || newPassword.length<6 || newPassword.length>512 || oldPassword.length>512) return false;
  const {data}=await db.from("darts_accounts").select("password_hash").eq("player_id",playerId).maybeSingle();
  if(!data) return false;
  const [salt,expected]=data.password_hash.split(":"); const actual=scryptSync(oldPassword,salt,64); const expectedBytes=Buffer.from(expected || "","hex");
  if(actual.length!==expectedBytes.length || !timingSafeEqual(actual,expectedBytes)) return false;
  const newSalt=randomBytes(16).toString("hex"); const password_hash=`${newSalt}:${scryptSync(newPassword,newSalt,64).toString("hex")}`;
  const result=await db.from("darts_accounts").update({password_hash,failed_attempts:0,locked_until:null}).eq("player_id",playerId);
  if(result.error) return false;
  await db.from("darts_sessions").delete().eq("player_id",playerId);
  await clearDartsSession();
  return true;
}
