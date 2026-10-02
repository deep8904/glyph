-- Run after any forced-failure scenario, in a fresh session, to confirm no lock from the failed
-- attempt survives. Parameterize :usename via psql -v.
select count(*) as surviving_locks
from pg_locks l
join pg_stat_activity a on a.pid = l.pid
where a.usename = :'usename' and a.state != 'idle';
