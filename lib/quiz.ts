import { createClient } from "@supabase/supabase-js";

export type CorrectOption = "A" | "B" | "C" | "D";
export type QuizDifficulty = "easy" | "medium" | "hard";

export type QuizQuestionRow = {
  id: string | number;
  topic_slug: string;
  difficulty: QuizDifficulty;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: CorrectOption;
  sort_order: number;
};

export type QuizResultRow = {
  id: string | number;
  nickname: string;
  topic_slug: string;
  difficulty: QuizDifficulty;
  score: number;
  total_questions: number;
  points_awarded: number;
  completed_perfect: boolean;
  answers?: unknown;
  created_at: string;
};

export type QuizQuestion = {
  id: string;
  question: string;
  options: [string, string, string, string];
  answer: number;
  sort_order: number;
};

export type QuizTopic = {
  id: string;
  title: string;
  icon: string;
  image: string;
};

export type QuizTopicWithQuestions = QuizTopic & {
  questions: QuizQuestion[];
};

export const quizTopics: QuizTopic[] = [
  {
    id: "animals",
    title: "Zvířata",
    icon: "Lion",
    image:
      "bg-[radial-gradient(circle_at_50%_30%,rgba(132,204,22,0.42),transparent_34%),linear-gradient(145deg,rgba(20,83,45,0.94),rgba(3,7,18,0.84))]",
  },
  {
    id: "world",
    title: "Svět",
    icon: "World",
    image:
      "bg-[radial-gradient(circle_at_48%_35%,rgba(56,189,248,0.45),transparent_34%),linear-gradient(145deg,rgba(30,64,175,0.9),rgba(15,23,42,0.9))]",
  },
  {
    id: "body",
    title: "Lidské tělo",
    icon: "Heart",
    image:
      "bg-[radial-gradient(circle_at_45%_34%,rgba(217,70,239,0.42),transparent_34%),linear-gradient(145deg,rgba(88,28,135,0.92),rgba(15,23,42,0.9))]",
  },
  {
    id: "ocean",
    title: "Oceán",
    icon: "Turtle",
    image:
      "bg-[radial-gradient(circle_at_50%_34%,rgba(45,212,191,0.36),transparent_34%),linear-gradient(145deg,rgba(14,116,144,0.92),rgba(8,47,73,0.94))]",
  },
  {
    id: "dinosaurs",
    title: "Dinosauři",
    icon: "Dino",
    image:
      "bg-[radial-gradient(circle_at_54%_34%,rgba(251,146,60,0.4),transparent_34%),linear-gradient(145deg,rgba(124,45,18,0.94),rgba(15,23,42,0.9))]",
  },
  {
    id: "space",
    title: "Vesmír",
    icon: "Rocket",
    image:
      "bg-[radial-gradient(circle_at_50%_34%,rgba(139,92,246,0.42),transparent_34%),linear-gradient(145deg,rgba(76,29,149,0.94),rgba(2,6,23,0.94))]",
  },
  {
    id: "insects",
    title: "Hmyz",
    icon: "Ladybug",
    image:
      "bg-[radial-gradient(circle_at_50%_34%,rgba(132,204,22,0.36),transparent_34%),linear-gradient(145deg,rgba(21,128,61,0.88),rgba(20,83,45,0.94))]",
  },
  {
    id: "plants",
    title: "Stromy a rostliny",
    icon: "Tree",
    image:
      "bg-[radial-gradient(circle_at_50%_34%,rgba(34,197,94,0.38),transparent_34%),linear-gradient(145deg,rgba(22,101,52,0.92),rgba(6,78,59,0.92))]",
  },
  {
    id: "records",
    title: "Světové rekordy",
    icon: "Trophy",
    image:
      "bg-[radial-gradient(circle_at_50%_34%,rgba(250,204,21,0.38),transparent_34%),linear-gradient(145deg,rgba(126,34,206,0.92),rgba(88,28,135,0.92))]",
  },
];

export function getSupabaseBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

export async function getQuizTopicsWithQuestions(): Promise<QuizTopicWithQuestions[]> {
  const supabase = getSupabaseBrowserClient();

  if (!supabase) {
    return quizTopics.map((topic) => ({ ...topic, questions: [] }));
  }

  const { data, error } = await supabase
    .from("quiz_questions")
    .select("id, topic_slug, difficulty, question, option_a, option_b, option_c, option_d, correct_option, sort_order")
    .order("topic_slug", { ascending: true })
    .order("difficulty", { ascending: true })
    .order("sort_order", { ascending: true });

  if (error || !data) {
    return quizTopics.map((topic) => ({ ...topic, questions: [] }));
  }

  return mergeQuestionsIntoTopics(data as QuizQuestionRow[]);
}

export function mergeQuestionsIntoTopics(rows: QuizQuestionRow[]): QuizTopicWithQuestions[] {
  return quizTopics.map((topic) => ({
    ...topic,
    questions: rows
      .filter((row) => row.topic_slug === topic.id)
      .filter((row) => (row.difficulty ?? "easy") === "easy")
      .sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0))
      .slice(0, 10)
      .map(mapQuestionRow),
  }));
}

export function mapQuestionRow(row: QuizQuestionRow): QuizQuestion {
  return {
    id: String(row.id),
    question: row.question,
    options: [row.option_a, row.option_b, row.option_c, row.option_d],
    answer: correctOptionToIndex(row.correct_option),
    sort_order: Number(row.sort_order ?? 0),
  };
}

export function correctOptionToIndex(option: CorrectOption) {
  return ["A", "B", "C", "D"].indexOf(option);
}
