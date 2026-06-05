import { PersonalSite } from "@/components/personal-site";
import { getTopics } from "@/lib/topics";
import { getSiteSettings } from "@/lib/site-settings";
import { getSectionPosts } from "@/lib/section-posts";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [topics, settings, posts] = await Promise.all([
    getTopics(),
    getSiteSettings(),
    getSectionPosts(),
  ]);

  return <PersonalSite topics={topics} settings={settings} posts={posts} />;
}
