"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, CalendarDays, Trophy, MapPin } from "lucide-react";
import data from "@/lib/league-data.json";
import { logout } from "./actions";
import { LeagueCalendar } from "./calendar";
import { Playoff } from "./playoff";
import type { PlayoffSeed, PlayoffResult } from "@/lib/darts-playoff";

type Data = typeof data;
type Match = Data["matches"][number];
const status: Record<string,string> = { PLAYED: "Odehráno", APPROVED: "Potvrzeno", PLANNED: "Naplánováno", CANCELLED: "Zrušeno" };
const date = (value: string) => value ? new Intl.DateTimeFormat("cs-CZ", { day: "numeric", month: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "UTC" }).format(new Date(`${value}Z`)) : "Termín není určen";
export default function League({data, live, account, playoff, playoffError, playoffSaved}: {data: Data; live: boolean; account: {id:number;name:string;isAdmin:boolean} | null; playoff:{seeds:PlayoffSeed[];results:PlayoffResult[]}; playoffError?:string; playoffSaved:boolean}) {
  const [competition, setCompetition] = useState(data.competitions.find(c => c.ACTIVE === "Y")?.COMP_ID || data.competitions[0]?.COMP_ID || "");
  const [filter, setFilter] = useState("all");
  const [player, setPlayer] = useState("");
  const names = useMemo(() => new Map(data.players.map(p => [p.PLAYER_ID,p.PLAYER_NAME])), [data.players]);
  const matches = useMemo(() => data.matches.filter(m => m.COMP_ID === competition), [data.matches, competition]);
  const standings = useMemo(() => {
    const rows = new Map<string,{id:string; name:string; played:number; wins:number; draws:number; losses:number; scored:number; conceded:number; points:number}>();
    for (const m of matches) {
      if (!["PLAYED", "APPROVED"].includes(m.STATUS)) continue;
      for (const id of [m.HOME_PLAYER,m.AWAY_PLAYER]) {
        const p = data.players.find(p => p.PLAYER_ID === id && p.STATUS === "T");
        if (!p) continue;
        const row = rows.get(id) || {id, name:p.PLAYER_NAME, played:0,wins:0,draws:0,losses:0,scored:0,conceded:0,points:0};
        row.played++;
        if (/^\d+:\d+$/.test(m.SCORE)) {
          const [home,away] = m.SCORE.split(":").map(Number); const own = id === m.HOME_PLAYER ? home : away; const other = id === m.HOME_PLAYER ? away : home;
          row.scored += own; row.conceded += other;
          if (own > other) { row.wins++; row.points += 3; } else if (own === other) { row.draws++; row.points++; } else row.losses++;
        }
        rows.set(id,row);
      }
    }
    return [...rows.values()].sort((a,b) => b.points-a.points || b.scored-a.scored || a.name.localeCompare(b.name,"cs"));
  }, [matches,data.players]);
  const visible = useMemo(() => matches.filter(m => (!player || m.HOME_PLAYER === player || m.AWAY_PLAYER === player) && (filter === "all" || (filter === "results" ? ["PLAYED","APPROVED"].includes(m.STATUS) : filter === "planned" ? m.STATUS === "PLANNED" : m.STATUS === "CANCELLED"))).sort((a,b) => (a.MATCH_DATE || "9999").localeCompare(b.MATCH_DATE || "9999")), [matches,player,filter]);
  const label = (m: Match, side: "HOME_PLAYER" | "AWAY_PLAYER") => names.get(m[side]) || "Neznámý hráč";
  const selectStyle = "rounded-xl border border-white/10 bg-[#202b25] px-4 py-3 text-sm text-white";
  return <main className="min-h-screen bg-[#101513] px-4 py-7 text-white sm:px-8"><div className="mx-auto max-w-7xl">
    <Link href="/sipky" className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white"><ArrowLeft size={16}/> Zpět na Šipky</Link>
    <div className="mt-6 flex justify-end">{live && (account ? <form action={logout} className="flex items-center gap-3 text-sm text-zinc-400"><>{account.isAdmin && <Link href="/sipky/hrusovanska-liga/sprava" className="text-emerald-400 hover:underline">Správa hráčů</Link>}<Link href="/sipky/hrusovanska-liga/profil" className="text-emerald-400 hover:underline">{account.name}</Link></><button className="rounded-full border border-white/15 px-4 py-2 text-white">Odhlásit</button></form> : <Link className="rounded-full border border-white/15 px-4 py-2 text-sm text-white" href="/sipky/hrusovanska-liga/prihlaseni">Přihlášení hráče</Link>)}</div><header className="mt-10 flex flex-wrap items-center justify-between gap-6 border-b border-white/10 pb-8"><div className="flex items-center gap-5"><Image src="/hrusovanska-liga-logo.jpg" alt="Logo Hrušovanské ligy" width={90} height={90} className="size-20 rounded-2xl object-cover sm:size-24"/><div><p className="text-xs font-bold uppercase tracking-[.25em] text-emerald-400">Šipky / jednotlivci</p><h1 className="mt-2 text-3xl font-black sm:text-5xl">Hrušovanská liga</h1><p className="mt-2 text-zinc-400">Výsledky, pořadí a rozpis zápasů</p></div></div><label className="grid gap-1 text-xs text-zinc-400">Soutěž<select value={competition} onChange={e => setCompetition(e.target.value)} className={selectStyle}>{data.competitions.map(c=><option key={c.COMP_ID} value={c.COMP_ID}>{c.COMP_NAME}</option>)}</select></label></header>
    <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.4fr]"><section className="min-w-0 rounded-3xl border border-white/10 bg-[#18211c] p-5 sm:p-7"><div className="flex items-center gap-3"><Trophy className="text-emerald-400"/><div><h2 className="text-2xl font-bold">Celkové pořadí – základní skupina</h2><p className="text-sm text-zinc-400">Výhra 3 body · remíza 1 bod</p></div></div><div className="mt-6 overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b border-white/10 text-xs uppercase text-zinc-500"><tr><th className="pb-3">#</th><th className="pb-3">Hráč</th><th className="pb-3 text-center" title="Zápasy">Z</th><th className="pb-3 text-center" title="Výhry / remízy / prohry">V/R/P</th><th className="pb-3 text-right">Skóre</th><th className="pb-3 text-right">Body</th></tr></thead><tbody>{standings.map((r,i)=><tr key={r.id} className="border-b border-white/5"><td className="py-3 text-zinc-500">{i+1}</td><td className="py-3 font-medium">{r.name}</td><td className="py-3 text-center text-zinc-400">{r.played}</td><td className="py-3 text-center text-zinc-400">{r.wins}/{r.draws}/{r.losses}</td><td className="py-3 text-right text-zinc-400">{r.scored}:{r.conceded}</td><td className="py-3 text-right font-bold text-emerald-400">{r.points}</td></tr>)}</tbody></table>{!standings.length && <p className="py-6 text-zinc-400">Zatím žádné odehrané zápasy.</p>}</div></section>
    <section className="min-w-0 rounded-3xl border border-white/10 bg-[#18211c] p-5 sm:p-7"><div className="flex items-center gap-3"><CalendarDays className="text-emerald-400"/><div><h2 className="text-2xl font-bold">Zápasy</h2><p className="text-sm text-zinc-400">Rozpis a výsledky soutěže</p></div></div><div className="mt-5 flex flex-wrap gap-2"><label className="sr-only" htmlFor="match-filter">Stav zápasu</label><select id="match-filter" value={filter} onChange={e=>setFilter(e.target.value)} className={selectStyle}><option value="all">Všechny zápasy</option><option value="planned">Naplánované</option><option value="results">Výsledky</option><option value="cancelled">Zrušené</option></select>{account && <button type="button" onClick={()=>setPlayer(String(account.id))} className="rounded-xl border border-emerald-400/30 px-4 py-3 text-sm text-emerald-300">Moje zápasy</button>}<label className="sr-only" htmlFor="player-filter">Hráč</label><select id="player-filter" value={player} onChange={e=>setPlayer(e.target.value)} className={selectStyle}><option value="">Všichni hráči</option>{data.players.filter(p=>matches.some(m=>m.HOME_PLAYER===p.PLAYER_ID || m.AWAY_PLAYER===p.PLAYER_ID)).sort((a,b)=>a.PLAYER_NAME.localeCompare(b.PLAYER_NAME,"cs")).map(p=><option key={p.PLAYER_ID} value={p.PLAYER_ID}>{p.PLAYER_NAME}</option>)}</select></div><p className="mt-4 text-xs text-zinc-500">Zobrazeno {visible.length} zápasů</p><div className="mt-2 max-h-[760px] overflow-y-auto">{visible.map(m=><article key={m.Id} className="border-b border-white/5 py-4"><div className="flex flex-wrap justify-between gap-2 text-xs text-zinc-400"><span>{date(m.MATCH_DATE)}</span><span className={m.STATUS === "CANCELLED" ? "text-rose-400" : "text-emerald-400"}>{status[m.STATUS] || "Bez stavu"}</span></div><div className="mt-2 flex items-center justify-between gap-3"><span className="font-medium">{label(m,"HOME_PLAYER")} <span className="mx-1 text-zinc-600">–</span> {label(m,"AWAY_PLAYER")}</span><strong className="shrink-0 text-lg">{m.SCORE || "– : –"}</strong></div>{live && <Link className="mt-2 inline-block text-xs font-semibold text-emerald-400 hover:underline" href={`/sipky/hrusovanska-liga/zapas/${m.Id}`}>Detail zápasu →</Link>}<div className="mt-1 text-xs text-zinc-500">{data.locations.find(l=>l.LOCATION_ID===m.LOCATION)?.NAME}{m.BOARD_ID && ` · ${data.boards.find(b=>b.BOARD_ID===m.BOARD_ID)?.BOARD_NAME || ""}`}</div></article>)}{!visible.length && <p className="py-8 text-zinc-400">Žádné zápasy pro vybraný filtr.</p>}</div></section></div>
    <Playoff competition={competition} players={data.players} seeds={playoff.seeds} results={playoff.results} isAdmin={!!account?.isAdmin} error={playoffError} saved={playoffSaved} />
    <LeagueCalendar matches={matches} players={data.players} live={live} />
    <footer className="flex items-center gap-2 py-8 text-sm text-zinc-500"><MapPin size={16}/>{data.locations[0]?.NAME} · {live ? "Aktuální data ligy" : "Archivní data z exportu původní aplikace"}</footer>
  </div></main>;
}
