import { getTypingResults } from "@/lib/marcelka";
import { KeyboardTypingGame } from "./typing-game";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Psaní na klávesnici | ZŠ Aktivity",
  description: "Hravé procvičování psaní znaků na české klávesnici.",
};

export default async function TypingPage() {
  const initialResults = await getTypingResults({ period: "all", limit: 30 });

  return <KeyboardTypingGame initialResults={initialResults} />;
}
