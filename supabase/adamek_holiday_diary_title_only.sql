alter table public.adamek_holiday_entries
  alter column description set default '';

alter table public.adamek_holiday_entries
  alter column description drop not null;

alter table public.adamek_holiday_entries
  drop constraint if exists adamek_holiday_entries_description_check;
