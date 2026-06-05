# Havelka Vitek personal website

Modern personal website built with the Next.js App Router, TypeScript, Tailwind CSS, Framer Motion, and Supabase.

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Supabase

The homepage reads node content from the `topics` table using:

- `slug`
- `title_cs`
- `title_en`
- `description_cs`
- `description_en`
- `image_url`

Supported slugs:

- `photography`
- `resin-art`
- `bookbinding`
- `vineyard`
- `programming`
- `dhl`
- `foot-tennis`
- `table-tennis`
- `emicka`

Fallback content is included so the site still renders if Supabase is unavailable.

The Emička quiz reads questions from `quiz_questions`. The admin UI is available at
`/emicka/admin` and expects:

- `topic_slug`
- `difficulty`
- `question`
- `option_a`
- `option_b`
- `option_c`
- `option_d`
- `correct_option`
- `sort_order`

Use [supabase/quiz_questions.sql](C:/Users/Vitek/Documents/projekty/havelkavit-web/supabase/quiz_questions.sql) to create the table and basic policies.

The real admin at `/admin` uses an HTTP-only cookie and these environment variables:

- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `ADMIN_AUTH_SECRET`
- `SUPABASE_SERVICE_ROLE_KEY`

Use [supabase/site_admin.sql](C:/Users/Vitek/Documents/projekty/havelkavit-web/supabase/site_admin.sql) to create editable homepage settings and topic columns.

Section posts are stored in `section_posts`. Each post belongs to a `topic_slug` and stores its Supabase-managed photo URL in `image_url`.

## Environment variables

Copy `.env.example` to `.env.local` for local development:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Set the same variables in Vercel under Project Settings -> Environment Variables.

## Production

```bash
npm run build
npm run start
```
