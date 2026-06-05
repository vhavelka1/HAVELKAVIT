import { QuizAdmin } from "./quiz-admin";

export const metadata = {
  title: "Emička | Admin kvízů",
  description: "Správa kvízových otázek pro Emičku.",
};

export default function EmickaAdminPage() {
  return <QuizAdmin />;
}
