import type { Topic } from "@/lib/topics";

export type AdminTopic = Topic & {
  persistedId?: string;
};
