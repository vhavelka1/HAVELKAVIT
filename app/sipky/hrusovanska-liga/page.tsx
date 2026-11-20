import { getLeagueData } from "@/lib/darts";
import League from "./league";
import { currentDartsPlayer } from "@/lib/darts-auth";
import { getPlayoffData } from "@/lib/darts-playoff";

export const dynamic = "force-dynamic";
export const metadata = { title: "Hrušovanská liga jednotlivců | Šipky", description: "Tabulka a zápasy Hrušovanské ligy jednotlivců." };
export default async function LeaguePage({searchParams}:{searchParams:Promise<{playoff_error?:string;playoff_saved?:string}>}) { const [{ data, live }, player, playoff, query] = await Promise.all([getLeagueData(), currentDartsPlayer(), getPlayoffData(), searchParams]); return <League data={data} live={live} playoff={playoff} playoffError={query.playoff_error} playoffSaved={!!query.playoff_saved} account={player ? {id: player.id, name: player.name, isAdmin: player.role.toUpperCase() === "ADMIN"} : null} />; }
