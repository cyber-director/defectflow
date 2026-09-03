-- DefectFlow schema: indexes
--
-- The staff queue query (category + status + priority order) and the
-- user's own complaint history are the two hottest read paths — both
-- need to hit an index, not a sequential scan.

create index complaints_queue_idx
on public.complaints (
  category,
  status,
  priority_score desc,
  created_at asc
);

create index complaints_reporter_idx
on public.complaints (reporter_id, created_at desc);

create index ticket_updates_complaint_idx
on public.ticket_updates (complaint_id, created_at asc);
