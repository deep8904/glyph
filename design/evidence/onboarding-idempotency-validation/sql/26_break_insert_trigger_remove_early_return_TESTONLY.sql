-- TEST-ONLY patch, applied AFTER 05_migration.sql in an isolated throwaway database: removes
-- serialize_null_slug_project_insert()'s `if new.slug is not null then return new;` early return,
-- so the trigger now locks the profile row unconditionally on every insert, including a real-slug
-- one. Used only to prove item 51's gate is discriminating (it must then correctly fail by
-- blocking) — never combined with any claim that the real migration behaves this way.
create or replace function public.serialize_null_slug_project_insert()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  perform 1 from public.profiles where id = new.owner_id for update;
  return new;
end;
$$;
