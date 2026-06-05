"use client";

import confetti from "canvas-confetti";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  Bug,
  Check,
  Heart,
  HeartPulse,
  Lightbulb,
  Lock,
  Map,
  PawPrint,
  RefreshCw,
  Rocket,
  Search,
  Shell,
  Smile,
  Sparkles,
  Star,
  TreePine,
  Trophy,
  Unlock,
  Waves,
} from "lucide-react";
import Link from "next/link";
import type { CSSProperties } from "react";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { getSupabaseBrowserClient, type QuizQuestionRow } from "@/lib/quiz";

type Screen = "nickname" | "intro" | "topics" | "difficulty" | "quiz" | "result";
type Difficulty = "easy" | "medium" | "hard";

type Question = {
  id: string;
  question: string;
  options: [string, string, string, string];
  answer: number;
};

type Topic = {
  id: string;
  title: string;
  description: string;
  image: string;
  questions: Record<Difficulty, Question[]>;
};

type LeaderboardEntry = {
  nickname: string;
  points: number;
  completed_quizzes: number;
  badges: string[];
};

type LeaderboardRow = {
  nickname: string;
  points: number;
  completed_quizzes?: number | null;
  badges?: string[] | null;
};

type PlayerProfile = {
  completed: string[];
  points: number;
  badges: string[];
};

const storageKey = "emicka-quiz-profile-v2";
const nicknameKey = "nickname";
const fallbackLeaderboardKey = "quizLeaderboard";
const answerLetters = ["A", "B", "C", "D"];
const topicDescriptions: Record<string, string> = {
  animals: "Poznej tvory z džungle, domu i divočiny.",
  world: "Cestuj po mapě, zemích a zajímavých místech.",
  body: "Objev, jak funguje lidské tělo.",
  ocean: "Ponoř se mezi mořské tvory a vlny.",
  dinosaurs: "Vydej se za dávnými obry pravěku.",
  space: "Prozkoumej planety, hvězdy a rakety.",
  insects: "Malý svět brouků, včel a motýlů.",
  plants: "Stromy, květiny a zelená příroda.",
  records: "Největší, nejrychlejší a nejúžasnější věci.",
};
const difficulties: Array<{
  id: Difficulty;
  title: string;
  points: number;
  tone: string;
  description: string;
}> = [
  {
    id: "easy",
    title: "Easy",
    points: 10,
    tone: "from-emerald-400 to-lime-300 text-emerald-950",
    description: "Lehký začátek na rozkoukání.",
  },
  {
    id: "medium",
    title: "Medium",
    points: 20,
    tone: "from-yellow-300 to-amber-300 text-amber-950",
    description: "Trochu větší výzva pro odvážné.",
  },
  {
    id: "hard",
    title: "Hard",
    points: 50,
    tone: "from-rose-400 to-fuchsia-400 text-white",
    description: "Pořádná výzva pro mistryni kvízů.",
  },
];

const topics: Topic[] = [
  makeTopic("animals", "Zvířata", "bg-[radial-gradient(circle_at_50%_30%,rgba(132,204,22,0.42),transparent_34%),linear-gradient(145deg,rgba(20,83,45,0.94),rgba(3,7,18,0.84))]", [
    ["Které zvíře je známé jako král džungle?", ["Tygr", "Lev", "Slon", "Žirafa"], 1],
    ["Který pták neumí létat?", ["Orel", "Tučňák", "Sova", "Čáp"], 1],
    ["Kolik nohou má pavouk?", ["6", "8", "10", "12"], 1],
    ["Které zvíře má chobot?", ["Nosorožec", "Slon", "Hroch", "Medvěd"], 1],
    ["Jak se jmenuje mládě psa?", ["Kotě", "Hříbě", "Štěně", "Tele"], 2],
    ["Co jí panda nejraději?", ["Bambus", "Sýr", "Mrkev", "Houby"], 0],
    ["Které zvíře mění barvu podle okolí?", ["Chameleon", "Koza", "Holub", "Křeček"], 0],
    ["Které zvíře je největší na světě?", ["Slon africký", "Žralok bílý", "Plejtvák obrovský", "Žirafa"], 2],
    ["Které zvíře má nejdelší krk?", ["Velbloud", "Žirafa", "Kůň", "Lama"], 1],
    ["Který savec umí létat?", ["Netopýr", "Sova", "Vážka", "Papoušek"], 0],
  ]),
  makeTopic("world", "Svět", "bg-[radial-gradient(circle_at_48%_35%,rgba(56,189,248,0.45),transparent_34%),linear-gradient(145deg,rgba(30,64,175,0.9),rgba(15,23,42,0.9))]", [
    ["Na kterém kontinentu leží Česká republika?", ["Asie", "Evropa", "Afrika", "Austrálie"], 1],
    ["Které město je hlavní město Francie?", ["Řím", "Berlín", "Paříž", "Madrid"], 2],
    ["Který oceán je největší?", ["Tichý", "Atlantský", "Indický", "Severní ledový"], 0],
    ["Která země má tvar boty?", ["Itálie", "Norsko", "Egypt", "Kanada"], 0],
    ["Jak se jmenuje nejvyšší hora světa?", ["Mont Blanc", "Kilimandžáro", "Mount Everest", "Sněžka"], 2],
    ["Která řeka protéká Prahou?", ["Labe", "Vltava", "Morava", "Dunaj"], 1],
    ["Který jazyk se používá v Brazílii?", ["Španělština", "Portugalština", "Angličtina", "Francouzština"], 1],
    ["Který světadíl je nejchladnější?", ["Afrika", "Antarktida", "Evropa", "Jižní Amerika"], 1],
    ["Která planeta je náš domov?", ["Mars", "Venuše", "Země", "Jupiter"], 2],
    ["Kde najdeme pyramidy v Gíze?", ["V Egyptě", "V Peru", "V Řecku", "V Japonsku"], 0],
  ]),
  makeTopic("body", "Lidské tělo", "bg-[radial-gradient(circle_at_45%_34%,rgba(217,70,239,0.42),transparent_34%),linear-gradient(145deg,rgba(88,28,135,0.92),rgba(15,23,42,0.9))]", [
    ["Který orgán pumpuje krev?", ["Plíce", "Srdce", "Žaludek", "Mozek"], 1],
    ["Čím dýcháme?", ["Plícemi", "Koleny", "Vlasy", "Ušima"], 0],
    ["Kolik máme obvykle dospělých zubů?", ["12", "20", "32", "44"], 2],
    ["Který smysl používáme očima?", ["Čich", "Sluch", "Zrak", "Chuť"], 2],
    ["Co chrání mozek?", ["Lebka", "Žebra", "Loket", "Pata"], 0],
    ["Kde máme chuťové pohárky?", ["Na jazyku", "Na rameni", "Na zádech", "Na patě"], 0],
    ["Co nám pomáhá slyšet?", ["Uši", "Kolena", "Prsty", "Obočí"], 0],
    ["Proč pijeme vodu?", ["Aby tělo fungovalo", "Aby zmizely boty", "Aby rostly kameny", "Aby se zastavil čas"], 0],
    ["Co chrání plíce a srdce?", ["Žebra", "Vlasy", "Prsty", "Kolena"], 0],
    ["Který orgán řídí tělo?", ["Mozek", "Žaludek", "Loket", "Pata"], 0],
  ]),
  makeTopic("ocean", "Oceán", "bg-[radial-gradient(circle_at_50%_34%,rgba(45,212,191,0.36),transparent_34%),linear-gradient(145deg,rgba(14,116,144,0.92),rgba(8,47,73,0.94))]", [
    ["Čím dýchají ryby?", ["Žábrami", "Listy", "Křídly", "Srstí"], 0],
    ["Který mořský tvor má osm chapadel?", ["Chobotnice", "Delfín", "Krab", "Žralok"], 0],
    ["Které zvíře si nosí krunýř?", ["Mořská želva", "Medúza", "Tuňák", "Rejnok"], 0],
    ["Co je korál?", ["Mořský živočich", "Druh mraku", "Horský kámen", "Pouštní strom"], 0],
    ["Který savec žije v moři a je velmi chytrý?", ["Delfín", "Vrabec", "Kůň", "Ještěrka"], 0],
    ["Jak chutná mořská voda?", ["Slaně", "Sladce", "Kysele", "Hořce jako kakao"], 0],
    ["Který tvor má klepeta?", ["Krab", "Sardinka", "Medúza", "Kosatka"], 0],
    ["Co způsobuje příliv a odliv?", ["Hlavně Měsíc", "Pouze vítr", "Sníh", "Semafory"], 0],
    ["Který tvor má žahavá chapadla?", ["Medúza", "Tučňák", "Mořský koník", "Treska"], 0],
    ["Která ryba má oranžové pruhy?", ["Klaun očkatý", "Kapr", "Štika", "Sumec"], 0],
  ]),
  makeTopic("dinosaurs", "Dinosauři", "bg-[radial-gradient(circle_at_54%_34%,rgba(251,146,60,0.4),transparent_34%),linear-gradient(145deg,rgba(124,45,18,0.94),rgba(15,23,42,0.9))]", [
    ["Který dinosaurus měl obrovské zuby a krátké ruce?", ["Tyrannosaurus rex", "Triceratops", "Stegosaurus", "Brachiosaurus"], 0],
    ["Který dinosaurus měl tři rohy?", ["Triceratops", "Velociraptor", "Diplodocus", "Ankylosaurus"], 0],
    ["Co jedl Brachiosaurus?", ["Rostliny", "Auta", "Ryby z konzervy", "Kameny"], 0],
    ["Jak se jmenují zkamenělé pozůstatky?", ["Fosilie", "Kompasy", "Drahokamy", "Mapy"], 0],
    ["Kdo zkoumá dinosaury?", ["Paleontolog", "Pekař", "Pilot", "Houslista"], 0],
    ["Který dinosaurus měl desky na zádech?", ["Stegosaurus", "Spinosaurus", "Iguanodon", "Allosaurus"], 0],
    ["Žili dinosauři dávno před lidmi?", ["Ano", "Ne", "Jen v zimě", "Jen v Praze"], 0],
    ["Který dinosaurus měl dlouhý krk?", ["Diplodocus", "Velociraptor", "T. rex", "Triceratops"], 0],
    ["Co znamená masožravec?", ["Jedl maso", "Jedl jen listí", "Pil jen mléko", "Uměl létat"], 0],
    ["Který dinosaurus měl klub na ocase?", ["Ankylosaurus", "Pteranodon", "Compsognathus", "Parasaurolophus"], 0],
  ]),
  makeTopic("space", "Vesmír", "bg-[radial-gradient(circle_at_50%_34%,rgba(139,92,246,0.42),transparent_34%),linear-gradient(145deg,rgba(76,29,149,0.94),rgba(2,6,23,0.94))]", [
    ["Která hvězda je nejblíže Zemi?", ["Slunce", "Polárka", "Sirius", "Vega"], 0],
    ["Na které planetě žijeme?", ["Země", "Mars", "Saturn", "Merkur"], 0],
    ["Která planeta je známá prstenci?", ["Saturn", "Venuše", "Mars", "Uran"], 0],
    ["Jak se jmenuje družice Země?", ["Měsíc", "Kometa", "Pluto", "Meteor"], 0],
    ["Která planeta je červená?", ["Mars", "Neptun", "Jupiter", "Země"], 0],
    ["Čím letí astronaut do vesmíru?", ["Raketou", "Ponorkou", "Traktorem", "Koloběžkou"], 0],
    ["Co je galaxie?", ["Obrovská skupina hvězd", "Druh ovoce", "Sportovní míč", "Kniha"], 0],
    ["Je Slunce planeta?", ["Ne, je to hvězda", "Ano", "Je to měsíc", "Je to kometa"], 0],
    ["Co potřebuje astronaut venku z lodi?", ["Skafandr", "Plavky", "Brusle", "Deštník"], 0],
    ["Která planeta je největší?", ["Jupiter", "Země", "Mars", "Venuše"], 0],
  ]),
  makeTopic("insects", "Hmyz", "bg-[radial-gradient(circle_at_50%_34%,rgba(132,204,22,0.36),transparent_34%),linear-gradient(145deg,rgba(21,128,61,0.88),rgba(20,83,45,0.94))]", [
    ["Kolik nohou má hmyz?", ["6", "8", "4", "10"], 0],
    ["Který hmyz vyrábí med?", ["Včela", "Mravenec", "Komár", "Moucha"], 0],
    ["Co se z housenky stane?", ["Motýl", "Ryba", "Kámen", "Žába"], 0],
    ["Který hmyz žije v mraveništi?", ["Mravenec", "Vosa", "Vážka", "Kobylka"], 0],
    ["Který hmyz svítí?", ["Světluška", "Brouk bramborák", "Moucha", "Včela"], 0],
    ["Jak se jmenuje červený brouček s tečkami?", ["Beruška", "Sršeň", "Komár", "Cvrček"], 0],
    ["Který hmyz skáče a cvrká?", ["Cvrček", "Včela", "Motýl", "Moucha"], 0],
    ["Co sbírá včela z květů?", ["Nektar", "Sůl", "Písek", "Sníh"], 0],
    ["Který hmyz má velká barevná křídla?", ["Motýl", "Mravenec", "Komár", "Blecha"], 0],
    ["Je pavouk hmyz?", ["Ne", "Ano", "Jen malý", "Jen v létě"], 0],
  ]),
  makeTopic("plants", "Stromy a rostliny", "bg-[radial-gradient(circle_at_50%_34%,rgba(34,197,94,0.38),transparent_34%),linear-gradient(145deg,rgba(22,101,52,0.92),rgba(6,78,59,0.92))]", [
    ["Co rostliny potřebují ke světlu?", ["Slunce", "Televizi", "Boty", "Klíče"], 0],
    ["Který strom má žaludy?", ["Dub", "Bříza", "Smrk", "Jabloň"], 0],
    ["Z čeho vyroste rostlina?", ["Semínko", "Kamínek", "Sklenička", "Knoflík"], 0],
    ["Co mají jehličnany místo listů?", ["Jehličí", "Peří", "Srst", "Šupiny"], 0],
    ["Která rostlina dává jablka?", ["Jabloň", "Růže", "Tulipán", "Kaktus"], 0],
    ["Co nasávají kořeny z půdy?", ["Vodu a živiny", "Hudbu", "Barvu oblohy", "Světlo lampy"], 0],
    ["Která část rostliny bývá barevná a voní?", ["Květ", "Kořen", "Kůra", "Pecka"], 0],
    ["Který strom je vánočním stromkem nejčastěji?", ["Smrk", "Palma", "Banánovník", "Bambus"], 0],
    ["Co vyrábí rostliny pro dýchání lidí?", ["Kyslík", "Písek", "Kov", "Mléko"], 0],
    ["Která rostlina má trny a často voní?", ["Růže", "Pampeliška", "Tráva", "Mech"], 0],
  ]),
  makeTopic("records", "Světové rekordy", "bg-[radial-gradient(circle_at_50%_34%,rgba(250,204,21,0.38),transparent_34%),linear-gradient(145deg,rgba(126,34,206,0.92),rgba(88,28,135,0.92))]", [
    ["Které zvíře je nejrychlejší na souši?", ["Gepard", "Želva", "Slon", "Kočka domácí"], 0],
    ["Která hora je nejvyšší na světě?", ["Mount Everest", "Sněžka", "Etna", "Olymp"], 0],
    ["Který oceán je největší?", ["Tichý oceán", "Indický oceán", "Atlantský oceán", "Jižní oceán"], 0],
    ["Které zvíře je největší?", ["Plejtvák obrovský", "Slon", "Žirafa", "Hroch"], 0],
    ["Který pták je největší?", ["Pštros", "Vrabec", "Tučňák císařský", "Orel"], 0],
    ["Která poušť je největší horká poušť?", ["Sahara", "Gobi", "Kalahari", "Atacama"], 0],
    ["Který savec má nejdelší krk?", ["Žirafa", "Kůň", "Velbloud", "Lama"], 0],
    ["Která planeta je největší ve Sluneční soustavě?", ["Jupiter", "Země", "Mars", "Venuše"], 0],
    ["Který strom může být velmi vysoký rekordman?", ["Sekvoje", "Jabloň", "Třešeň", "Keř rybízu"], 0],
    ["Která řeka bývá uváděna mezi nejdelšími?", ["Nil", "Vltava", "Sázava", "Ohře"], 0],
  ]),
];

const emptyProfile: PlayerProfile = { completed: [], points: 0, badges: [] };

export function EmickaQuizPlayground() {
  const [screen, setScreen] = useState<Screen>("intro");
  const nickname = useSyncExternalStore(subscribeNickname, loadNickname, getServerNickname);
  const [nicknameInput, setNicknameInput] = useState("");
  const [nicknameError, setNicknameError] = useState("");
  const [profile, setProfile] = useState<PlayerProfile>(() => loadProfile());
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [questionBank, setQuestionBank] = useState(topics);
  const [selectedTopicIndex, setSelectedTopicIndex] = useState(0);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>("easy");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [recentlyUnlockedTopicId, setRecentlyUnlockedTopicId] = useState("");
  const [message, setMessage] = useState("");

  const activeTopic = questionBank[selectedTopicIndex];
  const activeQuestions = activeTopic.questions[selectedDifficulty];
  const activeQuestion = activeQuestions[questionIndex];
  const completedCount = profile.completed.length;
  const gameProgress = completedCount / (questionBank.length * difficulties.length);
  const score = useMemo(
    () =>
      selectedAnswers.reduce(
        (total, answer, index) => total + (answer === activeQuestions[index]?.answer ? 1 : 0),
        0,
      ),
    [activeQuestions, selectedAnswers],
  );

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    let active = true;

    void fetchLeaderboard().then((entries) => {
      if (active) {
        setLeaderboard(entries);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!nickname) {
      return;
    }

    let active = true;

    void syncLeaderboardProfile(nickname, profile).then((entries) => {
      if (active) {
        setLeaderboard(entries);
      }
    });

    return () => {
      active = false;
    };
  }, [nickname, profile]);

  const effectiveScreen = nickname ? screen : "nickname";

  const goBack = () => {
    if (effectiveScreen === "quiz" || effectiveScreen === "result") {
      setScreen("difficulty");
      return;
    }

    if (effectiveScreen === "difficulty") {
      setScreen("topics");
      return;
    }

    setScreen("intro");
  };

  const saveNickname = () => {
    const trimmedNickname = nicknameInput.trim();

    if (!trimmedNickname) {
      setNicknameError("Zadej prosím přezdívku.");
      return;
    }

    window.localStorage.setItem(nicknameKey, trimmedNickname);
    window.dispatchEvent(new Event("nickname-change"));
    setNicknameError("");
    setScreen("intro");
  };

  const openTopic = (topicIndex: number) => {
    setSelectedTopicIndex(topicIndex);
    setMessage("");
    setScreen("difficulty");
  };

  const startQuiz = async (difficulty: Difficulty) => {
    if (!isUnlocked(selectedTopicIndex, difficulty, profile.completed)) {
      flash("Tahle výzva je zatím zamčená. Splň předchozí kvízy na 10 z 10.");
      return;
    }

    const supabase = getSupabaseBrowserClient();

    if (supabase) {
      const { data, error } = await supabase
        .from("quiz_questions")
        .select("id, topic_slug, difficulty, question, option_a, option_b, option_c, option_d, correct_option, sort_order")
        .eq("topic_slug", activeTopic.id)
        .eq("difficulty", difficulty)
        .order("sort_order", { ascending: true })
        .limit(10);

      if (error) {
        flash(error.message);
        return;
      }

      if (!data || data.length !== 10) {
        flash("Tato obtížnost zatím nemá 10 otázek.");
        return;
      }

      const questions = (data as QuizQuestionRow[]).map(mapDbQuestion);
      setQuestionBank((current) =>
        current.map((topic, index) =>
          index === selectedTopicIndex
            ? { ...topic, questions: { ...topic.questions, [difficulty]: questions } }
            : topic,
        ),
      );
    }

    setSelectedDifficulty(difficulty);
    setQuestionIndex(0);
    setSelectedAnswers([]);
    setMessage("");
    setScreen("quiz");
  };

  const answerQuestion = (answer: number) => {
    const nextAnswers = [...selectedAnswers, answer];
    setSelectedAnswers(nextAnswers);

    if (questionIndex === 9) {
      const nextScore = nextAnswers.reduce(
        (total, item, index) => total + (item === activeQuestions[index]?.answer ? 1 : 0),
        0,
      );

      if (nextScore === 10) {
        completeQuiz();
      }

      setScreen("result");
      return;
    }

    setQuestionIndex((current) => current + 1);
  };

  const completeQuiz = () => {
    const key = quizKey(activeTopic.id, selectedDifficulty);

    if (profile.completed.includes(key)) {
      return;
    }

    const completed = [...profile.completed, key];
    const points = profile.points + difficultyPoints(selectedDifficulty);
    const badges = calculateBadges(completed);
    const nextProfile = { completed, points, badges };
    const unlockedTopicId = nextUnlockedTopicId(selectedTopicIndex, selectedDifficulty);
    setProfile(nextProfile);
    setRecentlyUnlockedTopicId(unlockedTopicId);
    setLeaderboard((entries) => prepareLeaderboard(entries, nickname, nextProfile));
    void syncLeaderboardProfile(nickname, nextProfile).then(setLeaderboard);
  };

  const retryQuiz = () => {
    setQuestionIndex(0);
    setSelectedAnswers([]);
    setScreen("quiz");
  };

  const continueAfterResult = () => {
    setSelectedAnswers([]);
    setQuestionIndex(0);
    setScreen("topics");
  };

  const flash = (text: string) => {
    setMessage(text);
    window.setTimeout(() => setMessage(""), 3400);
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#060817] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(168,85,247,0.24),transparent_28rem),radial-gradient(circle_at_78%_24%,rgba(59,130,246,0.2),transparent_24rem),radial-gradient(circle_at_50%_92%,rgba(34,197,94,0.16),transparent_24rem)]" />
      <div className="pointer-events-none fixed inset-0 opacity-60 [background-image:radial-gradient(circle,rgba(255,255,255,0.7)_1px,transparent_1.5px)] [background-size:42px_42px]" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full flex-col overflow-hidden px-4 py-5 sm:px-6 lg:max-w-7xl lg:px-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          {effectiveScreen === "nickname" || effectiveScreen === "intro" ? (
            <Link
              href="/"
              className="inline-flex h-12 items-center gap-2 rounded-full border border-violet-300/30 bg-white/8 px-4 text-sm font-semibold text-white shadow-xl shadow-violet-950/30 backdrop-blur-md transition-colors hover:bg-white/14"
            >
              <ArrowLeft className="size-5" aria-hidden="true" />
              <span>Zpět</span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={goBack}
              className="inline-flex h-12 items-center gap-2 rounded-full border border-violet-300/30 bg-white/8 px-4 text-sm font-semibold text-white shadow-xl shadow-violet-950/30 backdrop-blur-md transition-colors hover:bg-white/14"
            >
              <ArrowLeft className="size-5" aria-hidden="true" />
              <span>Zpět</span>
            </button>
          )}

          <PlayerBar profile={profile} progress={gameProgress} />
        </header>

        {effectiveScreen === "nickname" ? (
          <NicknameScreen
            nickname={nicknameInput}
            error={nicknameError}
            onChange={(value) => {
              setNicknameInput(value);
              setNicknameError("");
            }}
            onContinue={saveNickname}
          />
        ) : null}
        {effectiveScreen === "intro" ? (
          <IntroScreen nickname={nickname} onContinue={() => setScreen("topics")} />
        ) : null}
        {effectiveScreen === "topics" ? (
          <TopicScreen
            profile={profile}
            nickname={nickname}
            leaderboard={leaderboard}
            recentlyUnlockedTopicId={recentlyUnlockedTopicId}
            message={message}
            onSelect={openTopic}
          />
        ) : null}
        {effectiveScreen === "difficulty" ? (
          <DifficultyScreen
            topic={activeTopic}
            topicIndex={selectedTopicIndex}
            profile={profile}
            message={message}
            onStart={(difficulty) => void startQuiz(difficulty)}
          />
        ) : null}
        {effectiveScreen === "quiz" ? (
          <QuizScreen
            topic={activeTopic}
            difficulty={selectedDifficulty}
            question={activeQuestion}
            questionIndex={questionIndex}
            onAnswer={answerQuestion}
          />
        ) : null}
        {effectiveScreen === "result" ? (
          <ResultScreen
            topic={activeTopic}
            difficulty={selectedDifficulty}
            score={score}
            onRetry={retryQuiz}
            onContinue={continueAfterResult}
          />
        ) : null}
      </div>
    </main>
  );
}

function NicknameScreen({
  nickname,
  error,
  onChange,
  onContinue,
}: {
  nickname: string;
  error: string;
  onChange: (value: string) => void;
  onContinue: () => void;
}) {
  return (
    <section className="flex flex-1 items-center justify-center py-10">
      <div className="w-full max-w-2xl rounded-[2.5rem] border border-violet-300/30 bg-slate-950/72 p-6 text-center shadow-2xl shadow-violet-950/40 backdrop-blur-xl sm:p-10">
        <div className="mx-auto grid size-20 place-items-center rounded-[1.75rem] bg-gradient-to-br from-violet-500 via-fuchsia-500 to-blue-500 shadow-2xl shadow-fuchsia-950/40">
          <Sparkles className="size-10 text-white" aria-hidden="true" />
        </div>
        <p className="mt-7 font-mono text-xs uppercase tracking-[0.32em] text-cyan-200">
          Emiččin kvíz
        </p>
        <h1 className="mt-3 text-4xl font-black leading-tight text-white drop-shadow-[0_4px_0_rgba(124,58,237,0.55)] sm:text-6xl">
          Než začneme...
        </h1>
        <p className="mx-auto mt-5 max-w-md text-base leading-7 text-zinc-100 sm:text-lg">
          Zadej si svou přezdívku, pod kterou budeš hrát.
        </p>

        <label className="mx-auto mt-8 block max-w-md text-left">
          <span className="mb-2 block text-sm font-black uppercase tracking-[0.18em] text-violet-200">
            Tvoje přezdívka
          </span>
          <input
            value={nickname}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                onContinue();
              }
            }}
            placeholder="Zadej svůj nickname..."
            className="h-14 w-full rounded-2xl border border-violet-300/30 bg-white/10 px-5 text-lg font-bold text-white outline-none shadow-xl shadow-violet-950/20 backdrop-blur-md transition-colors placeholder:text-zinc-400 focus:border-lime-300"
            autoFocus
          />
        </label>

        {error ? <Notice>{error}</Notice> : null}

        <button
          type="button"
          onClick={onContinue}
          className="mt-7 inline-flex h-16 w-full max-w-72 items-center justify-center gap-4 rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-blue-500 px-8 text-2xl font-black text-white shadow-2xl shadow-fuchsia-950/50 ring-2 ring-fuchsia-300/40 transition-transform hover:scale-[1.02]"
        >
          Pokračovat
          <ArrowRight className="size-8" aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}

function IntroScreen({ nickname, onContinue }: { nickname: string; onContinue: () => void }) {
  const rules = [
    { icon: Star, text: "Odpovídej na otázky co nejlépe." },
    { icon: Search, text: "Když si nebudeš vědět rady, můžeš hledat informace." },
    { icon: Unlock, text: "Pokud zvládneš kvíz bez jediné chyby, odemkneš nové téma." },
    { icon: Award, text: "Dokončuj témata a získej odznaky." },
    { icon: Trophy, text: "Každý kvíz obsahuje 10 otázek." },
  ];

  return (
    <section className="grid min-w-0 flex-1 items-center gap-8 py-10 lg:grid-cols-[0.9fr_1.1fr] lg:py-6">
      <div className="relative mx-auto hidden aspect-[3/4] w-full max-w-sm lg:block">
        <div className="absolute inset-x-4 bottom-0 h-40 rounded-[40%] bg-violet-600/25 blur-2xl" />
        <FloatingBadge className="left-10 top-6" icon={Lightbulb} />
        <FloatingBadge className="right-6 top-20" icon={Heart} />
        <FloatingBadge className="bottom-16 right-0" icon={Sparkles} />
        <FloatingBadge className="bottom-2 left-8" icon={Smile} large />
      </div>

      <div className="mx-auto w-full min-w-0 max-w-3xl text-center">
        <p className="mb-3 font-mono text-xs uppercase tracking-[0.32em] text-cyan-200">
          <Sparkles className="mr-2 inline size-4" aria-hidden="true" />
          Emiččin kvíz
        </p>
        <h1 className="mx-auto max-w-[12ch] text-4xl font-black leading-tight text-white drop-shadow-[0_4px_0_rgba(124,58,237,0.55)] sm:max-w-none sm:text-7xl">
          Ahoj, {nickname}!
        </h1>
        <p className="mt-2 text-3xl font-black text-violet-200 drop-shadow-[0_3px_0_rgba(30,64,175,0.45)] sm:text-5xl">
          Vítej u kvízu!
        </p>
        <p className="mx-auto mt-5 max-w-[19rem] text-base leading-7 text-zinc-100 sm:max-w-2xl sm:text-lg sm:leading-8">
          Připravila jsem pro tebe sérii kvízů z různých oblastí. Otestuj své
          znalosti, objevuj nové věci a odemykej další témata.
        </p>

        <div className="mx-auto mt-8 max-w-2xl rounded-[2rem] border border-violet-300/30 bg-slate-950/68 p-5 shadow-2xl shadow-violet-950/40 backdrop-blur-xl sm:p-7">
          <h2 className="mb-4 text-2xl font-black uppercase tracking-[0.2em] text-violet-300">
            Pravidla
          </h2>
          <div className="space-y-3 text-left">
            {rules.map(({ icon: Icon, text }) => (
              <div
                key={text}
                className="flex min-w-0 items-center gap-4 rounded-2xl border border-white/8 bg-white/6 p-4"
              >
                <Icon className="size-8 shrink-0 text-lime-300" aria-hidden="true" />
                <p className="min-w-0 max-w-[13rem] text-sm font-semibold leading-6 text-zinc-100 sm:max-w-none sm:text-base">
                  {text}
                </p>
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={onContinue}
          className="mt-7 inline-flex h-16 w-full max-w-72 items-center justify-center gap-4 rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-blue-500 px-8 text-2xl font-black text-white shadow-2xl shadow-fuchsia-950/50 ring-2 ring-fuchsia-300/40 transition-transform hover:scale-[1.02]"
        >
          Pokračovat
          <ArrowRight className="size-8" aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}

function TopicScreen({
  profile,
  nickname,
  leaderboard,
  recentlyUnlockedTopicId,
  message,
  onSelect,
}: {
  profile: PlayerProfile;
  nickname: string;
  leaderboard: LeaderboardEntry[];
  recentlyUnlockedTopicId: string;
  message: string;
  onSelect: (topicIndex: number) => void;
}) {
  return (
    <section className="relative flex-1 overflow-hidden py-8">
      <BackgroundStars />

      <div className="relative z-10 mb-6 text-center">
        <h1 className="text-5xl font-black leading-none text-white drop-shadow-[0_4px_0_rgba(124,58,237,0.55)] sm:text-7xl">
          Vyber si téma
        </h1>
        <p className="mt-3 text-lg font-semibold text-zinc-200">
          <Sparkles className="mr-2 inline size-5 text-fuchsia-300" aria-hidden="true" />
          Nejdřív téma, potom obtížnost.
        </p>
      </div>

      <div className="relative z-10">
        {message ? <Notice>{message}</Notice> : null}
      </div>

      <div className="relative z-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {topics.map((topic, index) => (
          <button
            key={topic.id}
            type="button"
            onClick={() => onSelect(index)}
            className="group min-h-64 overflow-hidden rounded-[2rem] border border-violet-300/25 p-0 text-left shadow-2xl shadow-violet-950/30 transition-all duration-300 hover:-translate-y-1 hover:scale-[1.025] hover:border-blue-200/55 hover:shadow-[0_0_34px_rgba(96,165,250,0.28)]"
          >
            <div className={`relative flex h-full min-h-64 flex-col justify-between ${topic.image} p-5`}>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_12%,rgba(255,255,255,0.24),transparent_8rem)]" />
              <CardHoverSparkles />
              {recentlyUnlockedTopicId === topic.id ? <UnlockBurst /> : null}
              <div className="relative">
                <span className="grid size-16 place-items-center rounded-2xl bg-white/14 text-white shadow-xl shadow-black/20 backdrop-blur-md">
                  <TopicIcon topicId={topic.id} className="size-9" />
                </span>
              </div>
              <div className="relative">
                <h2 className="text-3xl font-black leading-tight text-white drop-shadow-lg">
                  {topic.title}
                </h2>
                <p className="mt-3 text-sm font-semibold leading-6 text-zinc-100/90">
                  {topic.description}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="relative z-10">
        <Leaderboard profile={profile} nickname={nickname} entries={leaderboard} />
      </div>
    </section>
  );
}

function BackgroundStars() {
  const timeoutRef = useRef<number | null>(null);
  const [shootingStar, setShootingStar] = useState<{
    id: number;
    top: string;
    left: string;
  } | null>(null);
  const stars = [
    ["5%", "0.2s", "2px", "rgba(255,255,255,0.9)", "13s"],
    ["11%", "1.6s", "3px", "rgba(196,181,253,0.9)", "17s"],
    ["17%", "0.8s", "2px", "rgba(147,197,253,0.85)", "15s"],
    ["24%", "2.8s", "4px", "rgba(255,255,255,0.78)", "20s"],
    ["31%", "1.1s", "2px", "rgba(216,180,254,0.88)", "16s"],
    ["38%", "3.4s", "3px", "rgba(191,219,254,0.9)", "18s"],
    ["46%", "0.5s", "2px", "rgba(255,255,255,0.82)", "14s"],
    ["53%", "2.1s", "5px", "rgba(168,85,247,0.72)", "22s"],
    ["61%", "1.4s", "2px", "rgba(255,255,255,0.86)", "15s"],
    ["69%", "3s", "3px", "rgba(125,211,252,0.9)", "19s"],
    ["76%", "0.9s", "2px", "rgba(233,213,255,0.9)", "16s"],
    ["84%", "2.5s", "4px", "rgba(255,255,255,0.8)", "21s"],
    ["91%", "1.8s", "2px", "rgba(96,165,250,0.85)", "17s"],
    ["97%", "3.6s", "3px", "rgba(255,255,255,0.88)", "18s"],
  ];

  useEffect(() => {
    const schedule = () => {
      const delay = 10000 + Math.random() * 10000;

      timeoutRef.current = window.setTimeout(() => {
        setShootingStar({
          id: Date.now(),
          top: `${12 + Math.random() * 38}%`,
          left: `${Math.random() * 28}%`,
        });
        window.setTimeout(() => setShootingStar(null), 1200);
        schedule();
      }, delay);
    };

    schedule();

    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(168,85,247,0.13),transparent_18rem),radial-gradient(circle_at_82%_58%,rgba(59,130,246,0.12),transparent_22rem)]" />
      {stars.map(([left, delay, size, color, duration]) => (
        <span
          key={`${left}-${delay}`}
          className="emicka-falling-star absolute -top-8 rounded-full"
          style={{
            left,
            width: size,
            height: size,
            backgroundColor: color,
            boxShadow: `0 0 14px ${color}`,
            animationDelay: delay,
            animationDuration: duration,
          }}
        />
      ))}
      {shootingStar ? (
        <span
          key={shootingStar.id}
          className="emicka-shooting-star absolute"
          style={{ top: shootingStar.top, left: shootingStar.left }}
        />
      ) : null}
    </div>
  );
}

function CardHoverSparkles() {
  const sparkles = [
    ["12%", "18%", "0s"],
    ["22%", "74%", "0.12s"],
    ["46%", "12%", "0.24s"],
    ["72%", "24%", "0.08s"],
    ["84%", "68%", "0.18s"],
    ["58%", "84%", "0.3s"],
  ];

  return (
    <div className="pointer-events-none absolute inset-0 z-10 opacity-0 transition-opacity duration-200 group-hover:opacity-100" aria-hidden="true">
      {sparkles.map(([left, top, delay]) => (
        <span
          key={`${left}-${top}`}
          className="emicka-card-twinkle absolute size-1.5 rounded-full bg-white shadow-[0_0_14px_rgba(255,255,255,0.95)]"
          style={{ left, top, animationDelay: delay }}
        />
      ))}
    </div>
  );
}

function UnlockBurst() {
  const particles = [
    ["50%", "50%", "-34px", "-42px"],
    ["50%", "50%", "42px", "-34px"],
    ["50%", "50%", "-48px", "8px"],
    ["50%", "50%", "54px", "12px"],
    ["50%", "50%", "-24px", "46px"],
    ["50%", "50%", "26px", "50px"],
    ["50%", "50%", "0px", "-58px"],
    ["50%", "50%", "0px", "60px"],
  ];

  return (
    <div className="pointer-events-none absolute inset-0 z-20" aria-hidden="true">
      <div className="emicka-unlock-glow absolute inset-0 rounded-[2rem]" />
      {particles.map(([left, top, tx, ty], index) => (
        <span
          key={`${tx}-${ty}`}
          className="emicka-unlock-particle absolute size-2 rounded-full bg-lime-200 shadow-[0_0_18px_rgba(190,242,100,0.95)]"
          style={{
            left,
            top,
            "--tx": tx,
            "--ty": ty,
            animationDelay: `${index * 0.045}s`,
          } as CSSProperties}
        />
      ))}
    </div>
  );
}

function DifficultyScreen({
  topic,
  topicIndex,
  profile,
  message,
  onStart,
}: {
  topic: Topic;
  topicIndex: number;
  profile: PlayerProfile;
  message: string;
  onStart: (difficulty: Difficulty) => void;
}) {
  return (
    <section className="flex flex-1 items-center justify-center py-8">
      <div className="w-full max-w-5xl">
        <div className="mb-7 text-center">
          <div className="mx-auto mb-4 grid size-20 place-items-center rounded-[1.5rem] bg-white/12 text-white">
            <TopicIcon topicId={topic.id} className="size-11" />
          </div>
          <h1 className="text-5xl font-black text-white drop-shadow-[0_4px_0_rgba(124,58,237,0.55)]">
            {topic.title}
          </h1>
          <p className="mt-3 text-lg font-semibold text-zinc-200">Vyber obtížnost.</p>
        </div>

        {message ? <Notice>{message}</Notice> : null}

        <div className="grid gap-4 md:grid-cols-3">
          {difficulties.map((difficulty) => {
            const unlocked = isUnlocked(topicIndex, difficulty.id, profile.completed);
            const completed = profile.completed.includes(quizKey(topic.id, difficulty.id));

            return (
              <button
                key={difficulty.id}
                type="button"
                onClick={() => onStart(difficulty.id)}
                className={`rounded-[2rem] border p-6 text-left shadow-2xl transition-transform hover:-translate-y-1 ${
                  unlocked
                    ? "border-lime-300/50 bg-white/10 shadow-emerald-950/30"
                    : "border-violet-300/20 bg-white/6 opacity-70 shadow-violet-950/30"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className={`inline-flex rounded-full bg-gradient-to-r px-4 py-2 text-sm font-black ${difficulty.tone}`}>
                      {difficulty.title}
                    </div>
                    <h2 className="mt-5 text-3xl font-black text-white">{difficulty.points} bodů</h2>
                    <p className="mt-2 text-sm leading-6 text-zinc-300">{difficulty.description}</p>
                  </div>
                  <span className="grid size-12 place-items-center rounded-full bg-black/25">
                    {completed ? <Check className="size-6 text-lime-300" /> : unlocked ? <Unlock className="size-6 text-lime-300" /> : <Lock className="size-6 text-violet-200" />}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Leaderboard({
  profile,
  nickname,
  entries,
}: {
  profile: PlayerProfile;
  nickname: string;
  entries: LeaderboardEntry[];
}) {
  const currentNickname = nickname || "Hráč";
  const visibleEntries = prepareLeaderboard(entries, currentNickname, profile);

  return (
    <section className="mt-8 rounded-[2rem] border border-blue-300/25 bg-slate-950/72 p-4 shadow-2xl shadow-blue-950/30 backdrop-blur-xl sm:p-6">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-cyan-200">
            nejlepší badatelé
          </p>
          <h2 className="mt-2 text-3xl font-black text-white">
            Žebříček hráčů 🏆
          </h2>
        </div>
        <span className="rounded-full border border-violet-300/25 bg-violet-500/12 px-4 py-2 text-sm font-bold text-violet-100">
          Top 10
        </span>
      </div>

      <div className="hidden overflow-hidden rounded-2xl border border-white/10 md:block">
        <div className="grid grid-cols-[0.8fr_1.5fr_1fr] bg-white/8 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-violet-200">
          <span>Pořadí</span>
          <span>Přezdívka</span>
          <span className="text-right">Body</span>
        </div>
        {visibleEntries.map((entry, index) => {
          const isCurrent = entry.nickname === currentNickname;

          return (
            <div
              key={`${entry.nickname}-${index}`}
              className={`grid grid-cols-[0.8fr_1.5fr_1fr] items-center border-t px-5 py-4 text-sm font-bold ${
                isCurrent
                  ? "border-blue-300/45 bg-violet-500/15 ring-1 ring-inset ring-blue-300/40"
                  : "border-white/10 bg-white/5"
              }`}
            >
              <span className="text-lg">{rankLabel(index)}</span>
              <span className="truncate text-white">{entry.nickname}</span>
              <span className="text-right text-lime-200">{entry.points}</span>
            </div>
          );
        })}
      </div>

      <div className="grid gap-3 md:hidden">
        {visibleEntries.map((entry, index) => {
          const isCurrent = entry.nickname === currentNickname;

          return (
            <div
              key={`${entry.nickname}-mobile-${index}`}
              className={`rounded-2xl border p-4 ${
                isCurrent
                  ? "border-blue-300/55 bg-violet-500/18"
                  : "border-white/10 bg-white/6"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-2xl font-black">{rankLabel(index)}</span>
                <span className="rounded-full bg-black/25 px-3 py-1 text-sm font-black text-lime-200">
                  {entry.points} bodů
                </span>
              </div>
              <p className="mt-2 truncate text-lg font-black text-white">{entry.nickname}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function QuizScreen({
  topic,
  difficulty,
  question,
  questionIndex,
  onAnswer,
}: {
  topic: Topic;
  difficulty: Difficulty;
  question: Question;
  questionIndex: number;
  onAnswer: (answer: number) => void;
}) {
  return (
    <section className="flex flex-1 flex-col py-7">
      <div className="mb-6 grid items-center gap-4 md:grid-cols-3">
        <div className="flex items-center gap-3 text-2xl font-black text-lime-300">
          <TopicIcon topicId={topic.id} className="size-9" />
          {topic.title} / {difficultyLabel(difficulty)}
        </div>
        <div className="flex items-center justify-center gap-3 text-lg text-zinc-100">
          Otázka {questionIndex + 1} z 10
          <Progress value={(questionIndex + 1) / 10} />
        </div>
        <div className="flex items-center justify-start gap-2 text-lg text-zinc-100 md:justify-end">
          Můžeš si klidně googlit.
        </div>
      </div>

      <div className={`rounded-[2rem] border border-lime-300/20 ${topic.image} p-6 shadow-2xl shadow-black/40 sm:p-10`}>
        <div className="grid items-center gap-6 md:grid-cols-[1.2fr_0.8fr]">
          <h1 className="text-3xl font-black leading-tight text-white sm:text-5xl">
            {question.question}
          </h1>
          <div className="mx-auto grid size-32 place-items-center rounded-[2rem] bg-white/12 text-white shadow-2xl shadow-black/30 backdrop-blur-md">
            <TopicIcon topicId={topic.id} className="size-20" />
          </div>
        </div>
      </div>

      <div className="mt-6 grid flex-1 gap-4 md:grid-cols-2">
        {question.options.map((option, index) => (
          <button
            key={`${question.id}-${option}`}
            type="button"
            onClick={() => onAnswer(index)}
            className="group flex min-h-24 items-center gap-5 rounded-[1.5rem] border border-lime-300/35 bg-emerald-950/30 p-5 text-left shadow-xl shadow-black/25 backdrop-blur-md transition-colors hover:border-lime-200 hover:bg-lime-400/18"
          >
            <span className="grid size-14 shrink-0 place-items-center rounded-full border border-lime-300/55 text-2xl font-black text-white group-hover:bg-lime-300 group-hover:text-emerald-950">
              {answerLetters[index]}
            </span>
            <span className="text-xl font-black text-white">{option}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

function ResultScreen({
  topic,
  difficulty,
  score,
  onRetry,
  onContinue,
}: {
  topic: Topic;
  difficulty: Difficulty;
  score: number;
  onRetry: () => void;
  onContinue: () => void;
}) {
  const perfect = score === 10;

  useEffect(() => {
    if (!perfect) {
      return;
    }

    const end = Date.now() + 3000;
    const colors = ["#a855f7", "#22d3ee", "#84cc16", "#f472b6", "#facc15"];
    let frameId = 0;
    const frame = () => {
      confetti({
        particleCount: 6,
        angle: 60,
        spread: 60,
        origin: { x: 0 },
        colors,
      });
      confetti({
        particleCount: 6,
        angle: 120,
        spread: 60,
        origin: { x: 1 },
        colors,
      });

      if (Date.now() < end) {
        frameId = window.requestAnimationFrame(frame);
      }
    };

    frame();

    return () => window.cancelAnimationFrame(frameId);
  }, [perfect]);

  return (
    <section className="flex flex-1 items-center justify-center py-10">
      <div className="w-full max-w-3xl rounded-[2.5rem] border border-violet-300/25 bg-slate-950/72 p-6 text-center shadow-2xl shadow-violet-950/40 backdrop-blur-xl sm:p-10">
        <div className="mx-auto grid size-24 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-lime-300">
          {perfect ? <Trophy className="size-12 text-white" /> : <Smile className="size-12 text-white" />}
        </div>
        <h1 className="mt-6 text-4xl font-black text-white sm:text-6xl">
          {perfect ? "🎉 Výborně!" : "🙂 Dobrá práce!"}
        </h1>
        <p className="mt-2 text-lg font-bold text-violet-200">
          {topic.title} / {difficultyLabel(difficulty)}
        </p>
        <p className="mt-4 text-3xl font-black text-lime-300">
          Máš {score} z 10 správně.
        </p>
        <p className="mx-auto mt-4 max-w-xl text-lg leading-8 text-zinc-200">
          {perfect
            ? "Odemkla se nová výzva."
            : "Pro odemčení dalšího tématu potřebuješ 10 z 10."}
        </p>

        <div className="mt-8 flex justify-center">
          {perfect ? (
            <button
              type="button"
              onClick={onContinue}
              className="inline-flex h-14 items-center justify-center gap-3 rounded-2xl bg-lime-300 px-8 text-lg font-black text-emerald-950"
            >
              Pokračovat
              <ArrowRight className="size-5" aria-hidden="true" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex h-14 items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-8 text-lg font-black text-white"
            >
              <RefreshCw className="size-5" aria-hidden="true" />
              Zkusit znovu
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

function PlayerBar({ profile, progress }: { profile: PlayerProfile; progress: number }) {
  return (
    <div className="order-2 w-full basis-full rounded-[1.5rem] border border-white/10 bg-white/8 p-3 shadow-xl shadow-violet-950/25 backdrop-blur-md sm:order-none sm:w-auto sm:min-w-[430px] sm:basis-auto">
      <div className="grid grid-cols-3 gap-1 text-center text-[11px] font-black text-white sm:gap-2 sm:text-sm">
        <span>⭐ {profile.points} bodů</span>
        <span>🏅 {profile.badges.length} odznaků</span>
        <span>📚 {profile.completed.length} kvízů</span>
      </div>
      <div className="mt-3 h-3 overflow-hidden rounded-full bg-black/35">
        <div
          className="h-full rounded-full bg-gradient-to-r from-fuchsia-400 via-blue-400 to-lime-300"
          style={{ width: `${clamp(progress, 0, 1) * 100}%` }}
        />
      </div>
      {profile.badges.length > 0 ? (
        <p className="mt-2 truncate text-center text-xs font-semibold text-lime-200">
          {profile.badges.join(" · ")}
        </p>
      ) : null}
    </div>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto mb-5 max-w-3xl rounded-full border border-amber-300/30 bg-amber-300/12 px-5 py-3 text-center font-semibold text-amber-100">
      {children}
    </div>
  );
}

function Progress({ value }: { value: number }) {
  return (
    <div className="mt-3 h-3 w-40 overflow-hidden rounded-full bg-black/35 sm:mt-0">
      <div
        className="h-full rounded-full bg-gradient-to-r from-fuchsia-400 to-lime-300"
        style={{ width: `${clamp(value, 0, 1) * 100}%` }}
      />
    </div>
  );
}

function FloatingBadge({
  icon: Icon,
  className,
  large,
}: {
  icon: typeof Star;
  className: string;
  large?: boolean;
}) {
  return (
    <div
      className={`absolute grid place-items-center rounded-[2rem] border border-white/12 bg-white/10 text-lime-200 shadow-2xl shadow-violet-950/30 backdrop-blur-md ${large ? "size-28" : "size-20"} ${className}`}
    >
      <Icon className={large ? "size-14" : "size-10"} aria-hidden="true" />
    </div>
  );
}

function TopicIcon({ topicId, className }: { topicId: string; className: string }) {
  const icons: Record<string, typeof Star> = {
    animals: PawPrint,
    world: Map,
    body: HeartPulse,
    ocean: Waves,
    dinosaurs: Shell,
    space: Rocket,
    insects: Bug,
    plants: TreePine,
    records: Trophy,
  };
  const Icon = icons[topicId] ?? Star;

  return <Icon className={className} aria-hidden="true" />;
}

function makeTopic(
  id: string,
  title: string,
  image: string,
  base: Array<[string, [string, string, string, string], number]>,
): Topic {
  return {
    id,
    title,
    description: topicDescriptions[id] ?? "Vyzkoušej si novou oblast plnou otázek.",
    image,
    questions: {
      easy: base.map(([question, options, answer], index) => ({
        id: `${id}-easy-${index}`,
        question,
        options,
        answer,
      })),
      medium: base.map(([question, options, answer], index) => ({
        id: `${id}-medium-${index}`,
        question: `${question} (Medium)`,
        options: rotateOptions(options, answer, index % 4).options,
        answer: rotateOptions(options, answer, index % 4).answer,
      })),
      hard: base.map(([question, options, answer], index) => ({
        id: `${id}-hard-${index}`,
        question: `${question} (Hard)`,
        options: rotateOptions(options, answer, (index + 1) % 4).options,
        answer: rotateOptions(options, answer, (index + 1) % 4).answer,
      })),
    },
  };
}

function rotateOptions(
  options: [string, string, string, string],
  answer: number,
  amount: number,
) {
  const rotated = options.map((_, index) => options[(index + amount) % options.length]) as [
    string,
    string,
    string,
    string,
  ];
  const answerText = options[answer];

  return { options: rotated, answer: rotated.indexOf(answerText) };
}

function mapDbQuestion(row: QuizQuestionRow): Question {
  return {
    id: String(row.id),
    question: row.question,
    options: [row.option_a, row.option_b, row.option_c, row.option_d],
    answer: ["A", "B", "C", "D"].indexOf(row.correct_option),
  };
}

function loadProfile(): PlayerProfile {
  if (typeof window === "undefined") {
    return emptyProfile;
  }

  try {
    const stored = window.localStorage.getItem(storageKey);
    if (!stored) {
      return emptyProfile;
    }
    const parsed = JSON.parse(stored) as PlayerProfile;
    return {
      completed: Array.isArray(parsed.completed) ? parsed.completed : [],
      points: Number.isFinite(parsed.points) ? parsed.points : 0,
      badges: Array.isArray(parsed.badges) ? parsed.badges : [],
    };
  } catch {
    return emptyProfile;
  }
}

async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  const supabase = getSupabaseBrowserClient();

  if (!supabase) {
    return loadFallbackLeaderboard();
  }

  const { data, error } = await supabase
    .from("leaderboard")
    .select("nickname, points, completed_quizzes, badges")
    .order("points", { ascending: false })
    .limit(10);

  if (error || !data) {
    return loadFallbackLeaderboard();
  }

  const entries = normalizeLeaderboard(data as LeaderboardRow[]);
  saveFallbackLeaderboard(entries);

  return entries;
}

async function syncLeaderboardProfile(nickname: string, profile: PlayerProfile) {
  const currentNickname = nickname.trim();

  if (!currentNickname) {
    return fetchLeaderboard();
  }

  const supabase = getSupabaseBrowserClient();
  const fallbackEntry = profileToLeaderboardEntry(currentNickname, profile);

  if (!supabase) {
    return saveAndReturnFallback(fallbackEntry);
  }

  const { data: existing } = await supabase
    .from("leaderboard")
    .select("points, completed_quizzes, badges")
    .eq("nickname", currentNickname)
    .maybeSingle();
  const existingRow = existing as LeaderboardRow | null;
  const payload = {
    nickname: currentNickname,
    points: Math.max(profile.points, Number(existingRow?.points ?? 0)),
    completed_quizzes: Math.max(profile.completed.length, Number(existingRow?.completed_quizzes ?? 0)),
    badges: profile.badges.length >= (existingRow?.badges?.length ?? 0)
      ? profile.badges
      : existingRow?.badges ?? profile.badges,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("leaderboard")
    .upsert(payload, { onConflict: "nickname" });

  if (error) {
    return saveAndReturnFallback(fallbackEntry);
  }

  return fetchLeaderboard();
}

function prepareLeaderboard(
  entries: LeaderboardEntry[],
  nickname: string,
  profile: PlayerProfile,
) {
  const currentNickname = nickname.trim() || "Hráč";
  const currentEntry = profileToLeaderboardEntry(currentNickname, profile);
  const hasCurrentPlayer = entries.some((entry) => entry.nickname === currentNickname);
  const sourceEntries = hasCurrentPlayer
    ? entries
    : [...entries, currentEntry];

  return sourceEntries
    .map((entry) =>
      entry.nickname === currentNickname ? { ...entry, ...currentEntry } : entry,
    )
    .sort((a, b) => b.points - a.points)
    .slice(0, 10);
}

function normalizeLeaderboard(rows: LeaderboardRow[]) {
  return rows
    .map((entry) => ({
      nickname: typeof entry.nickname === "string" ? entry.nickname.trim() : "",
      points: Number.isFinite(Number(entry.points)) ? Number(entry.points) : 0,
      completed_quizzes: Number.isFinite(Number(entry.completed_quizzes))
        ? Number(entry.completed_quizzes)
        : 0,
      badges: Array.isArray(entry.badges) ? entry.badges : [],
    }))
    .filter((entry) => entry.nickname)
    .sort((a, b) => b.points - a.points)
    .slice(0, 10);
}

function profileToLeaderboardEntry(nickname: string, profile: PlayerProfile): LeaderboardEntry {
  return {
    nickname,
    points: profile.points,
    completed_quizzes: profile.completed.length,
    badges: profile.badges,
  };
}

function loadFallbackLeaderboard() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const stored = window.localStorage.getItem(fallbackLeaderboardKey);

    if (!stored) {
      return [];
    }

    return normalizeLeaderboard(JSON.parse(stored) as LeaderboardRow[]);
  } catch {
    return [];
  }
}

function saveFallbackLeaderboard(entries: LeaderboardEntry[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(fallbackLeaderboardKey, JSON.stringify(entries));
}

function saveAndReturnFallback(entry: LeaderboardEntry) {
  const entries = prepareFallbackLeaderboard(loadFallbackLeaderboard(), entry);
  saveFallbackLeaderboard(entries);

  return entries;
}

function prepareFallbackLeaderboard(entries: LeaderboardEntry[], entry: LeaderboardEntry) {
  const exists = entries.some((item) => item.nickname === entry.nickname);
  const source = exists
    ? entries.map((item) => (item.nickname === entry.nickname ? entry : item))
    : [...entries, entry];

  return source.sort((a, b) => b.points - a.points).slice(0, 10);
}

function rankLabel(index: number) {
  if (index === 0) return "🥇";
  if (index === 1) return "🥈";
  if (index === 2) return "🥉";

  return `${index + 1}.`;
}

function loadNickname() {
  if (typeof window === "undefined") {
    return "";
  }

  return window.localStorage.getItem(nicknameKey)?.trim() ?? "";
}

function getServerNickname() {
  return "";
}

function subscribeNickname(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener("nickname-change", onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener("nickname-change", onStoreChange);
  };
}

function isUnlocked(topicIndex: number, difficulty: Difficulty, completed: string[]) {
  if (difficulty === "easy") {
    return topicIndex === 0 || completed.includes(quizKey(topics[topicIndex - 1].id, "easy"));
  }

  if (difficulty === "medium") {
    return topics.every((topic) => completed.includes(quizKey(topic.id, "easy")));
  }

  return topics.every((topic) => completed.includes(quizKey(topic.id, "medium")));
}

function nextUnlockedTopicId(topicIndex: number, difficulty: Difficulty) {
  if (difficulty === "easy" && topicIndex < topics.length - 1) {
    return topics[topicIndex + 1].id;
  }

  return "";
}

function calculateBadges(completed: string[]) {
  const badges: string[] = [];

  if (hasTopicCompleted("animals", completed)) badges.push("🏅 Milovník zvířat");
  if (hasTopicCompleted("world", completed)) badges.push("🏅 Cestovatel světem");
  if (hasTopicCompleted("body", completed)) badges.push("🏅 Expert na lidské tělo");
  if (hasTopicCompleted("ocean", completed)) badges.push("🏅 Dobrodruh oceánu");
  if (hasTopicCompleted("records", completed)) badges.push("🏅 Lovec rekordů");
  if (completed.length === topics.length * difficulties.length) badges.push("🏅 Mistr kvízů");

  return badges;
}

function hasTopicCompleted(topicId: string, completed: string[]) {
  return difficulties.every((difficulty) => completed.includes(quizKey(topicId, difficulty.id)));
}

function difficultyPoints(difficulty: Difficulty) {
  return difficulties.find((item) => item.id === difficulty)?.points ?? 0;
}

function difficultyLabel(difficulty: Difficulty) {
  return difficulties.find((item) => item.id === difficulty)?.title ?? difficulty;
}

function quizKey(topicId: string, difficulty: Difficulty) {
  return `${topicId}:${difficulty}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
