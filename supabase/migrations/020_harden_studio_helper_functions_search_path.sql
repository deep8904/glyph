-- Close the "mutable search_path" advisory on the two helper functions
-- added in 018/019.

alter function public.is_studio_member(uuid, text[]) set search_path = public;
alter function public.studio_has_members(uuid) set search_path = public;
