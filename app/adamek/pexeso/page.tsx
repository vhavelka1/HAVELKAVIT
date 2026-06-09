import { getMemoryThemes } from "@/lib/adamek";
import { MemoryGame } from "./memory-game";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Adamovo pexeso",
  description: "Barevná pexeso hra pro Adámka.",
};

export default async function AdamekPexesoPage() {
  const themes = await getMemoryThemes();

  return <MemoryGame themes={themes} />;
}
