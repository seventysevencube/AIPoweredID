begin;
create table app.workflow_acceptances (
 project_id uuid primary key references app.projects(id) on delete cascade,
 version_id uuid not null references app.versions(id), accepted_by uuid not null, accepted_at timestamptz not null default now()
);
alter table app.workflow_acceptances enable row level security;
create function public.workflow_rpc(operation text,payload jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare actor uuid; admitted jsonb; pr app.projects%rowtype; rec app.records%rowtype;
 k text; content jsonb; ver uuid; j app.ai_jobs%rowtype; result jsonb; accepted app.workflow_acceptances%rowtype;
begin
 admitted:=public.app_rpc('session',payload);
 if admitted ? 'error' then return admitted; end if;
 actor:=(admitted->>'user_id')::uuid;
 select * into pr from app.projects where id=(payload->>'project_id')::uuid and owner_id=actor for update;
 if not found then return jsonb_build_object('error','not_found'); end if;
 foreach k in array array['analysis-brief','design-solution','design-objectives','design-assessments','design-content','design-sequence','design-plan'] loop
  if not exists(select 1 from app.records where project_id=pr.id and section=k) then
   content:='{"answers":{},"items":[]}'::jsonb;
   insert into app.records values(pr.id,k,1,content);
   insert into app.versions(project_id,section,revision,data,actor_id,operation_id) values(pr.id,k,1,content,actor,gen_random_uuid());
  end if;
 end loop;
 if operation='accept_analysis' then
  select * into rec from app.records where project_id=pr.id and section='analysis-brief';
  if rec.revision<>(payload->>'revision')::integer or rec.data#>>'{answers,gap,text}' is null then return jsonb_build_object('error','ai_inputs_changed'); end if;
  if payload->>'reviewed' is distinct from 'true' then return jsonb_build_object('error','review_required'); end if;
  select id into ver from app.versions where project_id=pr.id and section=rec.section and revision=rec.revision;
  insert into app.reviews(version_id,reviewer_id) values(ver,actor);
  insert into app.workflow_acceptances values(pr.id,ver,actor,now()) on conflict(project_id) do update set version_id=excluded.version_id,accepted_by=actor,accepted_at=now();
  update app.projects set stage='Design' where id=pr.id;
 elsif operation='apply' then
  select * into j from app.ai_jobs where id=(payload->>'job_id')::uuid and owner_id=actor and project_id=pr.id and state='completed';
  if not found then return jsonb_build_object('error','not_found'); end if;
  if payload->>'task' is distinct from j.policy->>'task' then return jsonb_build_object('error','invalid_request'); end if;
  -- An explicit apply creates only empty drafts; existing designer work is never overwritten.
  for result in select value from jsonb_array_elements(payload->'sections') loop
   k:=result->>'key';
   if k not in ('analysis-brief','design-solution','design-objectives','design-assessments','design-content','design-sequence','design-plan') then return jsonb_build_object('error','invalid_request'); end if;
   select * into rec from app.records where project_id=pr.id and section=k;
   if rec.data#>>'{answers,_job,text}'=j.id::text then continue; end if;
   if rec.data->'answers'<>'{}'::jsonb or rec.data->'items'<>'[]'::jsonb then return jsonb_build_object('error','draft_exists'); end if;
  end loop;
  for result in select value from jsonb_array_elements(payload->'sections') loop
   k:=result->>'key';
   select * into rec from app.records where project_id=pr.id and section=k;
   if rec.data#>>'{answers,_job,text}'=j.id::text then continue; end if;
   content:=result->'data';
   content:=jsonb_set(content,'{answers,_job}',jsonb_build_object('text',j.id::text,'status','provided'));
   update app.records set revision=revision+1,data=content where project_id=pr.id and section=k returning * into rec;
   insert into app.versions(project_id,section,revision,data,actor_id,operation_id) values(pr.id,k,rec.revision,content,actor,gen_random_uuid());
  end loop;
  update app.projects set saved_at=now() where id=pr.id;
 elsif operation<>'open' then return jsonb_build_object('error','invalid_request'); end if;
 select * into accepted from app.workflow_acceptances where project_id=pr.id;
 select jsonb_object_agg(r.section,to_jsonb(r)) into result from app.records r where r.project_id=pr.id;
 return jsonb_build_object('records',result,'accepted_revision',(select v.revision from app.versions v where v.id=accepted.version_id),
  'accepted_data',(select v.data from app.versions v where v.id=accepted.version_id),
  'jobs',coalesce((select jsonb_agg(x) from (select id,state,policy->>'task' as task,created_at,failure from app.ai_jobs where project_id=pr.id and owner_id=actor order by created_at desc limit 10) x),'[]'::jsonb));
end $$;
revoke all on function public.workflow_rpc(text,jsonb) from public,anon,authenticated;
grant execute on function public.workflow_rpc(text,jsonb) to service_role;
revoke all on app.workflow_acceptances from public,anon,authenticated;
-- Accepted briefs survive ordinary rolling history.
create or replace function app.prune_section_versions(target_project uuid, target_section text)
returns void language sql set search_path='' as $$
 delete from app.versions v where v.project_id=target_project and v.section=target_section
 and v.id in (select id from app.versions where project_id=target_project and section=target_section order by revision desc offset 10)
 and not exists(select 1 from app.reviews r where r.version_id=v.id)
 and not exists(select 1 from app.baseline_versions b where b.version_id=v.id)
 and not exists(select 1 from app.ai_job_inputs i where i.version_id=v.id)
 and not exists(select 1 from app.workflow_acceptances a where a.version_id=v.id);
$$;
commit;
