begin;
-- Remaining MVP data: project sources, new stage records, guest review, operator deletion.
-- Incremental: does not change or re-run migrations 1-4. Browsers still have no direct access.

-- Sources keep only extracted text and basic references; original files are not stored.
create table app.sources (
  id uuid primary key, project_id uuid not null references app.projects(id) on delete cascade,
  name text not null check(length(name) between 1 and 200),
  kind text not null check(kind in ('docx','pptx','text')),
  content text not null check(length(content)<=200000),
  refs jsonb not null default '[]'::jsonb, usable boolean not null,
  created_at timestamptz not null default now()
);
create index sources_project on app.sources(project_id,created_at);

-- Guest review links point at a fixed snapshot; only a hash of the link token is stored.
create table app.review_links (
  id uuid primary key, project_id uuid not null references app.projects(id) on delete cascade,
  owner_id uuid not null, token_hash text not null unique check(length(token_hash)=64),
  title text not null, snapshot jsonb not null,
  created_at timestamptz not null default now(), expires_at timestamptz not null,
  revoked_at timestamptz
);
create index review_links_project on app.review_links(project_id,created_at);
create table app.review_comments (
  id uuid primary key, link_id uuid not null references app.review_links(id) on delete cascade,
  target jsonb not null, display_name text not null check(length(btrim(display_name)) between 1 and 80),
  body text not null check(length(btrim(body)) between 1 and 4000),
  created_at timestamptz not null default now()
);
create index review_comments_link on app.review_comments(link_id,created_at);

alter table app.sources enable row level security;
alter table app.review_links enable row level security;
alter table app.review_comments enable row level security;

-- Removing a designer's access ends their guest links too.
create function app.revoke_links_on_access_removal() returns trigger language plpgsql set search_path='' as $$
begin
  if old.active and not new.active and new.user_id is not null then
    update app.review_links l set revoked_at=now() from app.projects p
      where l.project_id=p.id and p.owner_id=new.user_id and l.revoked_at is null;
  end if;
  return new;
end $$;
create trigger revoke_links_on_access_removal after update on app.pilot_access
for each row execute function app.revoke_links_on_access_removal();

-- Same as migration 4, plus the Sources, Preferences and Development records.
create or replace function public.workflow_rpc(operation text,payload jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare actor uuid; admitted jsonb; pr app.projects%rowtype; rec app.records%rowtype;
 k text; content jsonb; ver uuid; j app.ai_jobs%rowtype; result jsonb; accepted app.workflow_acceptances%rowtype;
begin
 admitted:=public.app_rpc('session',payload);
 if admitted ? 'error' then return admitted; end if;
 actor:=(admitted->>'user_id')::uuid;
 select * into pr from app.projects where id=(payload->>'project_id')::uuid and owner_id=actor for update;
 if not found then return jsonb_build_object('error','not_found'); end if;
 foreach k in array array['analysis-brief','design-solution','design-objectives','design-assessments','design-content','design-sequence','design-plan','sources','preferences','development'] loop
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
  'jobs',coalesce((select jsonb_agg(x) from (select id,state,policy->>'task' as task,created_at,failure from app.ai_jobs where project_id=pr.id and owner_id=actor order by created_at desc limit 30) x),'[]'::jsonb));
end $$;

-- Owner-only source operations. Text is returned only to the backend for AI input.
create function public.source_rpc(operation text,payload jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare actor uuid; admitted jsonb; pr app.projects%rowtype;
begin
 admitted:=public.app_rpc('session',payload);
 if admitted ? 'error' then return admitted; end if;
 actor:=(admitted->>'user_id')::uuid;
 select * into pr from app.projects where id=(payload->>'project_id')::uuid and owner_id=actor for update;
 if not found then return jsonb_build_object('error','not_found'); end if;
 if operation='add' then
  if not exists(select 1 from app.sources where id=(payload->>'source_id')::uuid) then
   if (select count(*) from app.sources where project_id=pr.id)>=20 then return jsonb_build_object('error','too_many_sources'); end if;
   insert into app.sources(id,project_id,name,kind,content,refs,usable)
    values((payload->>'source_id')::uuid,pr.id,payload->>'name',payload->>'kind',payload->>'content',coalesce(payload->'refs','[]'::jsonb),(payload->>'usable')::boolean);
  elsif not exists(select 1 from app.sources where id=(payload->>'source_id')::uuid and project_id=pr.id) then
   return jsonb_build_object('error','operation_reused');
  end if;
 elsif operation='remove' then
  delete from app.sources where id=(payload->>'source_id')::uuid and project_id=pr.id;
 elsif operation='texts' then
  return jsonb_build_object('sources',coalesce((select jsonb_agg(jsonb_build_object('id',s.id,'name',s.name,'kind',s.kind,'content',s.content,'refs',s.refs) order by s.created_at)
   from app.sources s where s.project_id=pr.id and s.usable),'[]'::jsonb));
 elsif operation<>'list' then return jsonb_build_object('error','invalid_request'); end if;
 return jsonb_build_object('sources',coalesce((select jsonb_agg(jsonb_build_object('id',s.id,'name',s.name,'kind',s.kind,'usable',s.usable,'created_at',s.created_at) order by s.created_at)
  from app.sources s where s.project_id=pr.id),'[]'::jsonb));
end $$;

-- Guest review. Owner operations need an admitted session; guest operations need a valid,
-- unexpired, unrevoked link whose owner still has access. Snapshots are built by the backend.
create function public.review_rpc(operation text,payload jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare actor uuid; admitted jsonb; pr app.projects%rowtype; l app.review_links%rowtype; now_at timestamptz:=now();
begin
 if operation in ('guest_open','guest_comment') then
  select x.* into l from app.review_links x join app.projects p on p.id=x.project_id
   join app.pilot_access m on m.user_id=p.owner_id and m.active
   where x.token_hash=payload->>'token_hash' and x.revoked_at is null and x.expires_at>now_at;
  if not found then return jsonb_build_object('error','link_unavailable'); end if;
  if operation='guest_comment' then
   if (select count(*) from app.review_comments where link_id=l.id)>=500 then return jsonb_build_object('error','too_many_comments'); end if;
   if jsonb_typeof(payload->'target') is distinct from 'object' or coalesce(payload#>>'{target,section}','')='' then
    return jsonb_build_object('error','invalid_request'); end if;
   insert into app.review_comments(id,link_id,target,display_name,body)
    values((payload->>'comment_id')::uuid,l.id,payload->'target',btrim(payload->>'display_name'),btrim(payload->>'body'))
    on conflict(id) do nothing;
  end if;
  return jsonb_build_object('title',l.title,'snapshot',l.snapshot,'expires_at',l.expires_at,
   'comments',coalesce((select jsonb_agg(jsonb_build_object('id',c.id,'target',c.target,'display_name',c.display_name,'body',c.body,'created_at',c.created_at) order by c.created_at)
    from app.review_comments c where c.link_id=l.id),'[]'::jsonb));
 end if;
 admitted:=public.app_rpc('session',payload);
 if admitted ? 'error' then return admitted; end if;
 actor:=(admitted->>'user_id')::uuid;
 select * into pr from app.projects where id=(payload->>'project_id')::uuid and owner_id=actor for update;
 if not found then return jsonb_build_object('error','not_found'); end if;
 if operation='create' then
  if (select count(*) from app.review_links where project_id=pr.id)>=50 then return jsonb_build_object('error','too_many_links'); end if;
  insert into app.review_links(id,project_id,owner_id,token_hash,title,snapshot,expires_at)
   values((payload->>'link_id')::uuid,pr.id,actor,payload->>'token_hash',pr.title,payload->'snapshot',now_at+interval '14 days');
 elsif operation='revoke' then
  update app.review_links set revoked_at=coalesce(revoked_at,now_at) where id=(payload->>'link_id')::uuid and project_id=pr.id;
 elsif operation<>'list' then return jsonb_build_object('error','invalid_request'); end if;
 return jsonb_build_object('links',coalesce((select jsonb_agg(jsonb_build_object('id',x.id,'created_at',x.created_at,'expires_at',x.expires_at,'revoked_at',x.revoked_at,
   'active',x.revoked_at is null and x.expires_at>now_at,'sections',x.snapshot->'sections','versions',x.snapshot->'versions',
   'comments',coalesce((select jsonb_agg(jsonb_build_object('id',c.id,'target',c.target,'display_name',c.display_name,'body',c.body,'created_at',c.created_at) order by c.created_at)
    from app.review_comments c where c.link_id=x.id),'[]'::jsonb)) order by x.created_at desc)
  from app.review_links x where x.project_id=pr.id),'[]'::jsonb));
end $$;

-- Pilot operator: verified owner-requested deletion. Links stop working first; the project,
-- its records, versions, sources, links, comments and stored request copies are removed.
create function public.operator_rpc(operation text,payload jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare pr app.projects%rowtype;
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
 end if;
 return jsonb_build_object('error','invalid_request');
end $$;

revoke all on function public.workflow_rpc(text,jsonb) from public;
revoke all on function public.source_rpc(text,jsonb) from public;
revoke all on function public.review_rpc(text,jsonb) from public;
revoke all on function public.operator_rpc(text,jsonb) from public;
revoke all on function app.revoke_links_on_access_removal() from public;
do $$ begin
  if exists(select 1 from pg_roles where rolname='anon') then
    revoke all on all tables in schema app from anon;
    revoke all on function public.workflow_rpc(text,jsonb) from anon;
    revoke all on function public.source_rpc(text,jsonb) from anon;
    revoke all on function public.review_rpc(text,jsonb) from anon;
    revoke all on function public.operator_rpc(text,jsonb) from anon;
  end if;
  if exists(select 1 from pg_roles where rolname='authenticated') then
    revoke all on all tables in schema app from authenticated;
    revoke all on function public.workflow_rpc(text,jsonb) from authenticated;
    revoke all on function public.source_rpc(text,jsonb) from authenticated;
    revoke all on function public.review_rpc(text,jsonb) from authenticated;
    revoke all on function public.operator_rpc(text,jsonb) from authenticated;
  end if;
  if exists(select 1 from pg_roles where rolname='service_role') then
    grant execute on function public.workflow_rpc(text,jsonb) to service_role;
    grant execute on function public.source_rpc(text,jsonb) to service_role;
    grant execute on function public.review_rpc(text,jsonb) to service_role;
    grant execute on function public.operator_rpc(text,jsonb) to service_role;
  end if;
end $$;
commit;
