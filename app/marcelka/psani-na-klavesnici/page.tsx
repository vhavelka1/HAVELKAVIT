import { getTypingResults } from "@/lib/marcelka";
import { KeyboardTypingGame } from "./typing-game";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Psani na klavesnici | Marcelka",
  description: "Hravé procvicovani psani znaku na ceske klavesnici.",
};

export default async function TypingPage() {
  const initialResults = await getTypingResults({ period: "all", limit: 30 });

  return <KeyboardTypingGame initialResults={initialResults} />;
}
