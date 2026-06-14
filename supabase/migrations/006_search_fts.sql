-- V3 Feature 4: Full-text search (trigger-maintained tsvector columns)

-- ── profiles ─────────────────────────────────────────────────────────────────
alter table public.profiles add column if not exists fts tsvector;

create or replace function public.profiles_fts_update() returns trigger language plpgsql as $$
begin
  new.fts := to_tsvector('english',
    coalesce(new.display_name, '') || ' ' ||
    coalesce(new.username, '') || ' ' ||
    coalesce(new.bio, '')
  );
  return new;
end;
$$;

create trigger profiles_fts_trigger
  before insert or update on public.profiles
  for each row execute function public.profiles_fts_update();

update public.profiles set fts = to_tsvector('english',
  coalesce(display_name, '') || ' ' || coalesce(username, '') || ' ' || coalesce(bio, '')
);

create index if not exists profiles_fts_idx on public.profiles using gin(fts);

-- ── projects ─────────────────────────────────────────────────────────────────
alter table public.projects add column if not exists fts tsvector;

create or replace function public.projects_fts_update() returns trigger language plpgsql as $$
begin
  new.fts := to_tsvector('english',
    coalesce(new.title, '') || ' ' ||
    coalesce(new.short_description, '') || ' ' ||
    coalesce(new.long_description, '') || ' ' ||
    coalesce(new.genre, '') || ' ' ||
    coalesce(array_to_string(new.tags, ' '), '')
  );
  return new;
end;
$$;

create trigger projects_fts_trigger
  before insert or update on public.projects
  for each row execute function public.projects_fts_update();

update public.projects set fts = to_tsvector('english',
  coalesce(title, '') || ' ' || coalesce(short_description, '') || ' ' ||
  coalesce(long_description, '') || ' ' || coalesce(genre, '') || ' ' ||
  coalesce(array_to_string(tags, ' '), '')
);

create index if not exists projects_fts_idx on public.projects using gin(fts);

-- ── devlog_posts ─────────────────────────────────────────────────────────────
alter table public.devlog_posts add column if not exists fts tsvector;

create or replace function public.devlog_posts_fts_update() returns trigger language plpgsql as $$
begin
  new.fts := to_tsvector('english',
    coalesce(new.title, '') || ' ' ||
    coalesce(new.content, '')
  );
  return new;
end;
$$;

create trigger devlog_posts_fts_trigger
  before insert or update on public.devlog_posts
  for each row execute function public.devlog_posts_fts_update();

update public.devlog_posts set fts = to_tsvector('english',
  coalesce(title, '') || ' ' || coalesce(content, '')
);

create index if not exists devlog_posts_fts_idx on public.devlog_posts using gin(fts);
