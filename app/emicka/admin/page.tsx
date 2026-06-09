import { QuizAdmin } from "./quiz-admin";
import { PageAdminLogin } from "@/components/page-admin-login";
import { isPageAdminAuthenticated } from "@/lib/page-admin";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Emička | Admin kvízů",
  description: "Správa kvízových otázek pro Emičku.",
};

export default async function EmickaAdminPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const [isLoggedIn, params] = await Promise.all([
    isPageAdminAuthenticated("emicka"),
    searchParams ?? Promise.resolve({} as { error?: string }),
  ]);

  if (!isLoggedIn) {
    return (
      <PageAdminLogin
        pageId="emicka"
        title="Administrace Emičky"
        subtitle="Zadej jednoduché heslo pro správu kvízů."
        showError={params.error === "login"}
      />
    );
  }

  return <QuizAdmin />;
}
