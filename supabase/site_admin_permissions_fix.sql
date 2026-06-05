grant usage on schema public to anon, authenticated;

grant select on public.site_settings to anon, authenticated;
grant all on public.site_settings to service_role;

grant select on public.topics to anon, authenticated;
grant all on public.topics to service_role;
grant usage, select on sequence public.topics_id_seq to service_role;

grant select on public.section_posts to anon, authenticated;
grant all on public.section_posts to service_role;
grant usage, select on sequence public.section_posts_id_seq to service_role;
