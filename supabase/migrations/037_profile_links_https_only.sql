-- Phase 10: profile social links are written straight from the browser and rendered
-- as <a href> on the public profile. Nothing stopped javascript: / data: URLs
-- (stored XSS on a public page). Existing rows were checked: all are https.
alter table public.profiles add constraint profiles_github_url_https check (github_url is null or github_url ~ '^https://[^[:space:]]+$');
alter table public.profiles add constraint profiles_itchio_url_https check (itchio_url is null or itchio_url ~ '^https://[^[:space:]]+$');
alter table public.profiles add constraint profiles_twitter_url_https check (twitter_url is null or twitter_url ~ '^https://[^[:space:]]+$');
alter table public.profiles add constraint profiles_website_url_https check (website_url is null or website_url ~ '^https://[^[:space:]]+$');
