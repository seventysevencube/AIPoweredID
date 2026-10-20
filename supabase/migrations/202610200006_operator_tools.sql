begin;
-- Read-only operator views: approved accounts and AI budget/queue status. Incremental: does
-- not change or re-run migrations 1-5. operator_rpc stays service-role only.
create or replace function public.operator_rpc(operation text,payload jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare pr app.projects%rowtype; period app.ai_periods%rowtype; ctl app.ai_control%rowtype;
begin
 if operation='list_projects' then
  return jsonb_build_object('projects',coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'title',p.title,'saved_at',p.saved_at) order by p.saved_at desc)
   from app.projects p join app.pilot_access m on m.user_id=p.owner_id where m.email=lower(btrim(payload->>'owner_email'))),'[]'::jsonb));
 elsif operation='delete_project' then
  select p.* into pr from app.projects p join app.pilot_access m on m.user_id=p.owner_id
   where p.id=(payload->>'project_id')::uuid and m.email=lower(btrim(payload->>'owner_email')) for update of p;
  if not found then return jsonb_build_object('error','not_found'); end if;
  update app.review_links set revoked_at=coalesce(revoked_at,now()) where project_id=pr.id;
  delete from app.reviews r using app.versions v where r.version_id=v.id and v.project_id=pr.id;
  delete from app.baseline_versions b using app.baselines x where b.baseline_id=x.id and x.project_id=pr.id;
  delete from app.baselines where project_id=pr.id;
  delete from app.receipts where request#>>'{payload,project_id}'=pr.id::text;
  delete from app.projects where id=pr.id;
  return jsonb_build_object('ok',true);
 elsif operation='pilot_list' then
  -- Emails only, with whether each has signed in and how many projects it owns.
  return jsonb_build_object('accounts',coalesce((select jsonb_agg(jsonb_build_object('email',m.email,'active',m.active,
    'signed_in',m.user_id is not null,'changed_at',m.changed_at,
    'projects',(select count(*) from app.projects x where x.owner_id=m.user_id)) order by m.changed_at desc)
   from app.pilot_access m),'[]'::jsonb));
 elsif operation='ai_status' then
  select * into ctl from app.ai_control where id=1;
  select * into period from app.ai_periods b where b.starts_at<=now() and b.ends_at>now();
  return jsonb_build_object(
   'period',case when period.id is null then null else jsonb_build_object('starts_at',period.starts_at,'ends_at',period.ends_at,'spent_microusd',period.spent_microusd) end,
   'reserved_microusd',(select coalesce(sum(j.reserved_microusd),0) from app.ai_jobs j where j.period_id=period.id),
   'pause_reason',ctl.pause_reason,'active_job',ctl.active_job,
   'jobs',coalesce((select jsonb_agg(jsonb_build_object('id',j.id,'state',j.state,'task',j.policy->>'task','created_at',j.created_at,
     'calls',coalesce((select jsonb_agg(jsonb_build_object('step',c.step,'state',c.state,'max_microusd',c.max_microusd,'observed_microusd',c.observed_microusd) order by c.started_at)
      from app.ai_calls c where c.job_id=j.id),'[]'::jsonb)) order by j.created_at)
    from app.ai_jobs j where j.state in ('queued','running','cost_pending')),'[]'::jsonb));
 end if;
 return jsonb_build_object('error','invalid_request');
end $$;
revoke all on function public.operator_rpc(text,jsonb) from public;
do $$ begin
  if exists(select 1 from pg_roles where rolname='anon') then
    revoke all on function public.operator_rpc(text,jsonb) from anon;
  end if;
  if exists(select 1 from pg_roles where rolname='authenticated') then
    revoke all on function public.operator_rpc(text,jsonb) from authenticated;
  end if;
  if exists(select 1 from pg_roles where rolname='service_role') then
    grant execute on function public.operator_rpc(text,jsonb) to service_role;
  end if;
end $$;
commit;
