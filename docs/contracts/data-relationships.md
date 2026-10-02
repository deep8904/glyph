# Data relationships contract

Core object graph (verify column names against schema):
- `Developer/Studio → Project → Devlog | Collaboration | Playtest`; Jams/Events are contextual extensions.
- `projects` (owner_id, slug, stage, lifecycle, visibility, cover_url/cover_image_url, screenshots[], external_links{}, tags[], genre, engine, is_primary).
- `devlog_posts` (project_id, slug, title, content, published_at, is_featured).
- `follows` (follower_id, followed_id); `user_blocks` (blocker_id, blocked_id); `user_mutes` (muter_id, muted_id).
- `studio_members` (user_id, studio_id, role) [owner/admin/member]; `studio_projects` (project_id, studio_id); studios.status = active.
- `collaboration_posts` (author_id, project_id, post_type, role_needed/role_offered, contract_type, status, expires_at); applications unique per (post, applicant).
- `playtest_requests` (project_id, status, requested_testers, current_testers, focus_areas[], platforms[]); sessions per (tester, playtest).
- `jam_entries` (project_id, jam_id, admin_approved); `game_jams` (slug, title, status, admin_approved).
- `publisher_accounts` (user_id); `publisher_shortlists` (publisher_id, items[]).

Discovery reads go through `discoverable_*` views + `search_*` RLS and the `feed_items` view (keyset `?cursor=` paging on feed).
