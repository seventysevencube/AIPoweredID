begin;
-- The browser has no direct access to application tables or this RPC.
-- Netlify verifies provider identity, then this transaction rechecks admission and pilot access.
create schema if not exists app;
revoke all on schema app from public;
create table app.pilot_access (
  email text primary key, active boolean not null default true, user_id uuid unique,
  changed_at timestamptz not null default now()
);
create table app.challenges (
  email text primary key references app.pilot_access(email), id uuid not null unique,
  digest text not null, issued_at timestamptz not null, expires_at timestamptz not null,
  failures integer not null default 0, consumed_at timestamptz, admitted boolean not null default false
);
create table app.admissions (
  session_id uuid primary key, user_id uuid not null, email text not null references app.pilot_access(email),
  revoked boolean not null default false, created_at timestamptz not null default now()
);
create table app.projects (
  id uuid primary key, owner_id uuid not null, title text not null,
  stage text not null default 'Analysis', current_section text not null default 'context',
  saved_at timestamptz not null default now()
);
create table app.records (
  project_id uuid references app.projects(id) on delete cascade, section text not null,
  revision integer not null, data jsonb not null,
  primary key(project_id, section)
);
create table app.versions (
  id uuid primary key default gen_random_uuid(), project_id uuid not null, section text not null,
  revision integer not null, data jsonb not null, actor_id uuid not null,
  created_at timestamptz not null default now(), operation_id uuid not null,
  unique(project_id, section, revision),
  foreign key(project_id,section) references app.records(project_id,section) on delete cascade
);
create table app.receipts (
  user_id uuid not null, operation_id uuid not null, request jsonb not null, result jsonb not null,
  primary key(user_id,operation_id)
);
create table app.reviews (
  id uuid primary key default gen_random_uuid(), version_id uuid not null references app.versions(id),
  reviewer_id uuid not null, reviewed_at timestamptz not null default now()
);
create table app.baselines (
  id uuid primary key default gen_random_uuid(), project_id uuid not null references app.projects(id),
  stage text not null, accepted_by uuid not null, accepted_at timestamptz not null default now()
);
create table app.baseline_versions (
  baseline_id uuid references app.baselines(id), version_id uuid references app.versions(id),
  primary key(baseline_id,version_id)
);
-- RLS defense in depth: no anon/authenticated policies are deliberately provided.
do $$ declare t record; begin
  for t in select tablename from pg_tables where schemaname='app' loop
    execute format('alter table app.%I enable row level security',t.tablename);
  end loop;
end $$;

create or replace function public.app_rpc(operation text, payload jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  clock_time timestamptz := now();
  mail text := lower(trim(payload->>'email'));
  challenge app.challenges%rowtype;
  member app.pilot_access%rowtype;
  admission app.admissions%rowtype;
  project app.projects%rowtype;
  rec app.records%rowtype;
  receipt app.receipts%rowtype;
  actor uuid;
  op_id uuid;
  result jsonb;
  section_name text;
  content jsonb;
begin
  if operation='pilot_set' then
    insert into app.pilot_access(email,active) values(mail,(payload->>'active')::boolean)
    on conflict(email) do update set active=excluded.active,changed_at=clock_time;
    if not (payload->>'active')::boolean then
      update app.admissions set revoked=true where email=mail;
      update app.challenges set consumed_at=clock_time where email=mail;
    end if;
    return jsonb_build_object('ok',true);
  elsif operation='request_code' then
    select * into member from app.pilot_access where email=mail and active for share;
    if not found then return jsonb_build_object('error','not_eligible'); end if;
    -- Serialize even the first challenge, when no challenge row exists yet.
    perform pg_advisory_xact_lock(hashtext('code:'||mail));
    select * into challenge from app.challenges where email=mail for update;
    if found and challenge.issued_at > clock_time - interval '60 seconds' then
      return jsonb_build_object('error','rate_limited');
    end if;
    insert into app.challenges(email,id,digest,issued_at,expires_at)
    values(mail,(payload->>'challenge_id')::uuid,payload->>'digest',clock_time,clock_time+interval '10 minutes')
    on conflict(email) do update set id=excluded.id,digest=excluded.digest,issued_at=excluded.issued_at,
      expires_at=excluded.expires_at,failures=0,consumed_at=null,admitted=false;
    return jsonb_build_object('ok',true);
  elsif operation='verify_code' then
    select * into challenge from app.challenges where id=(payload->>'challenge_id')::uuid for update;
    if not found then return jsonb_build_object('error','code_invalid'); end if;
    select * into member from app.pilot_access where email=challenge.email and active for share;
    if not found then return jsonb_build_object('error','code_invalid'); end if;
    if challenge.consumed_at is not null or challenge.failures>=5 or challenge.expires_at<=clock_time then
      return jsonb_build_object('error','code_expired');
    end if;
    if challenge.digest <> payload->>'digest' then
      update app.challenges set failures=failures+1 where id=challenge.id;
      return jsonb_build_object('error',case when challenge.failures+1>=5 then 'code_expired' else 'code_invalid' end);
    end if;
    update app.challenges set consumed_at=clock_time where id=challenge.id;
    return jsonb_build_object('email',challenge.email);
  elsif operation='admit' then
    select * into challenge from app.challenges where id=(payload->>'challenge_id')::uuid for update;
    if not found or challenge.consumed_at is null or challenge.admitted or challenge.expires_at<=clock_time
      or challenge.email<>mail then return jsonb_build_object('error','unauthorized'); end if;
    select * into member from app.pilot_access where email=mail and active for update;
    if not found or (member.user_id is not null and member.user_id<>(payload->>'user_id')::uuid) then
      return jsonb_build_object('error','unauthorized');
    end if;
    update app.pilot_access set user_id=(payload->>'user_id')::uuid where email=mail;
    update app.challenges set admitted=true where id=challenge.id;
    insert into app.admissions(session_id,user_id,email)
      values((payload->>'session_id')::uuid,(payload->>'user_id')::uuid,mail);
    return jsonb_build_object('ok',true);
  end if;

  actor := (payload->>'user_id')::uuid;
  select * into admission from app.admissions
    where session_id=(payload->>'session_id')::uuid and user_id=actor and not revoked;
  if not found then return jsonb_build_object('error','unauthorized'); end if;
  select * into member from app.pilot_access where email=admission.email and user_id=actor and active for share;
  if not found then return jsonb_build_object('error','unauthorized'); end if;

  if operation='session' then return jsonb_build_object('user_id',actor,'email',admission.email);
  elsif operation='signout' then
    update app.admissions set revoked=true where session_id=admission.session_id;
    return jsonb_build_object('ok',true);
  elsif operation='projects' then
    select coalesce(jsonb_agg(to_jsonb(p)||jsonb_build_object('outstanding',(select count(*) from (values ('context','task'),('context','desired'),('context','current'),('audience','roles')) as core(s,k) left join app.records r on r.project_id=p.id and r.section=core.s where coalesce(trim(r.data#>>array['answers',core.k,'text']),'')='' or coalesce(r.data#>>array['answers',core.k,'status'],'unknown')<>'provided')) order by p.saved_at desc),'[]') into result
      from app.projects p where owner_id=actor;
    return jsonb_build_object('projects',result);
  end if;

  if operation in ('create','save','restore') then
    op_id := (payload->>'operation_id')::uuid;
    perform pg_advisory_xact_lock(hashtext(actor::text||op_id::text));
    select * into receipt from app.receipts where user_id=actor and operation_id=op_id;
    if found then
      if receipt.request<>jsonb_build_object('operation',operation,'payload',payload-'session_id') then return jsonb_build_object('error','operation_reused'); end if;
      return receipt.result;
    end if;
  end if;

  if operation='create' then
    insert into app.projects(id,owner_id,title)
      values((payload->>'project_id')::uuid,actor,coalesce(nullif(trim(payload->>'title'),''),'Untitled project')) returning * into project;
    foreach section_name in array array['context','evidence','audience','stakeholders','org-results','workplace','learning'] loop
      content := jsonb_build_object('answers','{}'::jsonb,'items','[]'::jsonb);
      if section_name='context' then content:=jsonb_set(content,'{answers}',jsonb_build_object('title',jsonb_build_object('text',project.title,'status','provided'))); end if;
      insert into app.records values(project.id,section_name,1,content);
      insert into app.versions(project_id,section,revision,data,actor_id,operation_id)
        values(project.id,section_name,1,content,actor,op_id);
    end loop;
    result:=jsonb_build_object('project',to_jsonb(project));
  else
    select * into project from app.projects where id=(payload->>'project_id')::uuid and owner_id=actor for update;
    if not found then return jsonb_build_object('error','not_found'); end if;
    if operation='open' then
      select jsonb_object_agg(r.section,to_jsonb(r)) into result from app.records r where project_id=project.id;
      return jsonb_build_object('project',to_jsonb(project),'records',result);
    elsif operation='resume' then
      if payload->>'section' not in ('context','evidence','audience','stakeholders','org-results','workplace','learning') then
        return jsonb_build_object('error','invalid_request'); end if;
      update app.projects set current_section=payload->>'section' where id=project.id;
      return jsonb_build_object('ok',true);
    end if;
    select * into rec from app.records where project_id=project.id and section=payload->>'section' for update;
    if not found then return jsonb_build_object('error','not_found'); end if;
    if operation='history' then
      select coalesce(jsonb_agg(to_jsonb(v) order by revision desc),'[]') into result from app.versions v
        where project_id=project.id and section=rec.section;
      return jsonb_build_object('versions',result);
    end if;
    if operation not in ('save','restore') then return jsonb_build_object('error','invalid_request'); end if;
    if rec.revision<>(payload->>'base_revision')::integer then
      return jsonb_build_object('error','conflict','record',to_jsonb(rec)); end if;
    if operation='restore' then
      select v.data into content from app.versions v where v.project_id=project.id and v.section=rec.section
        and v.id=(payload->>'version_id')::uuid;
      if not found then return jsonb_build_object('error','not_found'); end if;
    else content:=payload->'data'; end if;
    update app.records set data=content,revision=revision+1 where project_id=project.id and section=rec.section returning * into rec;
    insert into app.versions(project_id,section,revision,data,actor_id,operation_id)
      values(project.id,rec.section,rec.revision,content,actor,op_id);
    update app.projects set saved_at=clock_time,
      title=case when rec.section='context' then coalesce(nullif(trim(content#>>'{answers,title,text}'),''),'Untitled project') else title end
      where id=project.id;
    result:=jsonb_build_object('record',to_jsonb(rec),'saved_at',clock_time,'operation_id',op_id);
  end if;
  insert into app.receipts values(actor,op_id,jsonb_build_object('operation',operation,'payload',payload-'session_id'),result);
  return result;
end $$;
revoke all on function public.app_rpc(text,jsonb) from public;
do $$ begin
  if exists(select 1 from pg_roles where rolname='anon') then
    revoke all on schema app from anon;
    revoke all on all tables in schema app from anon;
    revoke all on function public.app_rpc(text,jsonb) from anon;
  end if;
  if exists(select 1 from pg_roles where rolname='authenticated') then
    revoke all on schema app from authenticated;
    revoke all on all tables in schema app from authenticated;
    revoke all on function public.app_rpc(text,jsonb) from authenticated;
  end if;
  if exists(select 1 from pg_roles where rolname='service_role') then
    grant execute on function public.app_rpc(text,jsonb) to service_role;
  end if;
end $$;

commit;
