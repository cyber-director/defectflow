-- DefectFlow schema: storage
--
-- Private bucket for complaint photos + thumbnails. All uploads and all
-- signed-URL generation happen server-side via the admin (service-role)
-- client in the /api/complaints route handler, which bypasses storage
-- RLS by design — so no client-facing storage.objects policies are
-- required or created here. Leaving RLS at its default (enabled, zero
-- policies) means the anon/authenticated roles have no direct access to
-- this bucket at all, which is the intended security posture.

insert into storage.buckets (id, name, public)
values ('complaint-images', 'complaint-images', false)
on conflict (id) do nothing;
