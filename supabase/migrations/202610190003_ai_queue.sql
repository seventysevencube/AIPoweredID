begin;

-- Provider policy is controlled by the backend. Applying the schema alone
-- does not enable a paid provider or expose worker operations to browsers. Monthly dates are explicit
-- operator configuration; there is deliberately no automatic budget reset.
create table app.ai_control (
  id integer primary key check(id=1), active_job uuid, fence bigint not null default 0,
  pause_reason text, changed_at timestamptz not null default now()
);
insert into app.ai_control(id) values(1);
create table app.ai_periods (
  id uuid primary key default gen_random_uuid(), starts_at timestamptz not null,
  ends_at timestamptz not null, spent_microusd bigint not null default 0 check(spent_microusd>=0),
  check(starts_at<ends_at)
);
create table app.ai_jobs (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null,
  project_id uuid references app.projects(id) on delete set null, request_id uuid not null,
  request jsonb not null, input_snapshot jsonb, input_manifest jsonb not null,
  policy jsonb not null check(policy->>'provider' in ('simulated','openai')),
  state text not null default 'queued' check(state in ('queued','running','cost_pending','completed','failed','cancelled')),
  period_id uuid references app.ai_periods(id), allowance_microusd bigint not null check(allowance_microusd>0),
  reserved_microusd bigint not null default 0 check(reserved_microusd>=0),
  claim_token uuid, fence bigint, lease_until timestamptz, result jsonb, failure text,
  retry_of uuid references app.ai_jobs(id), created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(), unique(owner_id,request_id)
);
create index ai_queue_order on app.ai_jobs(created_at,id) where state='queued';
create table app.ai_job_inputs (
  job_id uuid references app.ai_jobs(id) on delete cascade,
  version_id uuid references app.versions(id) on delete cascade,
  primary key(job_id,version_id)
);
create table app.ai_calls (
  id uuid primary key, job_id uuid not null references app.ai_jobs(id), step text not null,
  state text not null check(state in ('started','completed','failed','uncertain','reused')),
  max_microusd bigint not null check(max_microusd>=0), actual_microusd bigint,
  observed_microusd bigint, result jsonb, failure text, outcome jsonb,
  reused_from uuid references app.ai_calls(id), reconciliation_reference text,
  started_at timestamptz not null default now(), finished_at timestamptz,
  unique(job_id,step), check(actual_microusd is null or actual_microusd>=0)
);

alter table app.ai_control enable row level security;
alter table app.ai_periods enable row level security;
alter table app.ai_jobs enable row level security;
alter table app.ai_job_inputs enable row level security;
alter table app.ai_calls enable row level security;

-- A queued/running result must remain tied to its exact saved inputs even after
-- ordinary history rolls past ten. Whole-project deletion still removes content.
create or replace function app.prune_section_versions(target_project uuid, target_section text)
returns void language sql set search_path='' as $$
  delete from app.versions v
  where v.project_id=target_project and v.section=target_section
    and v.id in (select older.id from app.versions older
      where older.project_id=target_project and older.section=target_section
      order by older.revision desc offset 10)
    and not exists(select 1 from app.reviews r where r.version_id=v.id)
    and not exists(select 1 from app.baseline_versions b where b.version_id=v.id)
    and not exists(select 1 from app.ai_job_inputs i where i.version_id=v.id);
$$;
create function app.ai_clear_deleted_content() returns trigger language plpgsql set search_path='' as $$
begin
  update app.ai_calls c set result=null, outcome=outcome-'result' where c.job_id in
    (select j.id from app.ai_jobs j where j.project_id=old.id);
  update app.ai_jobs j set input_snapshot=null,result=null,project_id=null,
    state=case when j.state='queued' then 'cancelled' else j.state end
    where j.project_id=old.id;
  return old;
end $$;
create trigger clear_ai_project_content before delete on app.projects
for each row execute function app.ai_clear_deleted_content();

create function app.ai_core_ready(snapshot jsonb) returns boolean language sql immutable set search_path='' as $$
  select not exists (
    select 1 from (values('context','task'),('context','desired'),('context','current'),('audience','roles')) as k(s,f)
    where coalesce(snapshot#>>array[k.s,'data','answers',k.f,'status'],'')<>'provided'
      or length(btrim(coalesce(snapshot#>>array[k.s,'data','answers',k.f,'text'],''),
        E' \t\n\r\f\v'||chr(160)||chr(5760)||chr(8192)||chr(8193)||chr(8194)||chr(8195)||chr(8196)||chr(8197)||chr(8198)||chr(8199)||chr(8200)||chr(8201)||chr(8202)||chr(8232)||chr(8233)||chr(8239)||chr(8287)||chr(12288)||chr(65279)))=0
  );
$$;

-- Only the backend service role can invoke this entry. HTTP routes must select
-- owner operations explicitly; worker/accounting operations are never public.
create function public.ai_rpc(operation text, payload jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare
  ctl app.ai_control%rowtype; j app.ai_jobs%rowtype; old_job app.ai_jobs%rowtype;
  p app.ai_periods%rowtype; c app.ai_calls%rowtype;
  actor uuid; admitted jsonb; snapshot jsonb; manifest jsonb; intent jsonb;
  amount bigint; max_cost bigint; reserved bigint; step_key text; step_config jsonb;
  output jsonb; invalid boolean; now_at timestamptz:=clock_timestamp();
begin
  -- All claims and money transitions serialize on one pilot-wide row. Never
  -- steal an expired claim while a provider call might still be running.
  select * into ctl from app.ai_control where id=1 for update;
  now_at:=clock_timestamp();
  if operation in ('enqueue','job','budget') then
    admitted:=public.app_rpc('session',payload);
    if admitted ? 'error' then return admitted; end if;
    actor:=(admitted->>'user_id')::uuid;
  end if;

  if operation='open_period' then
    if (payload->>'starts_at')::timestamptz >= (payload->>'ends_at')::timestamptz
      or exists(select 1 from app.ai_periods b where b.starts_at<(payload->>'ends_at')::timestamptz
        and b.ends_at>(payload->>'starts_at')::timestamptz) then
      return jsonb_build_object('error','invalid_period');
    end if;
    insert into app.ai_periods(starts_at,ends_at) values((payload->>'starts_at')::timestamptz,(payload->>'ends_at')::timestamptz) returning * into p;
    return jsonb_build_object('period_id',p.id);
  elsif operation='budget' then
    select * into p from app.ai_periods b where b.starts_at<=now_at and b.ends_at>now_at;
    if not found then return jsonb_build_object('error','ai_budget_unconfigured'); end if;
    select coalesce(sum(x.reserved_microusd),0) into reserved from app.ai_jobs x where x.period_id=p.id;
    return jsonb_build_object('limit_microusd',20000000,'warning_microusd',16000000,
      'spent_microusd',p.spent_microusd,'reserved_microusd',reserved,
      'period_starts_at',p.starts_at,'period_ends_at',p.ends_at,
      'pending_microusd',(select coalesce(sum(x.reserved_microusd),0) from app.ai_jobs x where x.state='cost_pending'),
      'warning',p.spent_microusd>=16000000,'paused',ctl.pause_reason is not null,'pause_reason',ctl.pause_reason);
  elsif operation='enqueue' then
    if not exists(select 1 from app.projects x where x.id=(payload->>'project_id')::uuid and x.owner_id=actor for update) then
      return jsonb_build_object('error','not_found'); end if;
    intent:=jsonb_build_object('project_id',payload->'project_id','expected_revisions',payload->'expected_revisions','retry_of',payload->'retry_of','task',payload#>'{policy,task}','workflow_hash',md5((payload->'workflow_input')::text));
    select * into j from app.ai_jobs x where x.owner_id=actor and x.request_id=(payload->>'request_id')::uuid;
    if found then
      if j.request<>intent then return jsonb_build_object('error','operation_reused'); end if;
      return jsonb_build_object('job_id',j.id,'state',j.state);
    end if;
    if ctl.pause_reason is not null then return jsonb_build_object('error','ai_cost_pending'); end if;
    select * into p from app.ai_periods b where b.starts_at<=now_at and b.ends_at>now_at;
    if not found then return jsonb_build_object('error','ai_budget_unconfigured'); end if;
    select jsonb_object_agg(r.section,jsonb_build_object('revision',r.revision,'data',r.data)),
      jsonb_object_agg(r.section,jsonb_build_object('version_id',v.id,'revision',r.revision)) into snapshot,manifest
      from app.records r join app.versions v on v.project_id=r.project_id and v.section=r.section and v.revision=r.revision
      where r.project_id=(payload->>'project_id')::uuid and r.section in ('context','evidence','audience','stakeholders','org-results','workplace','learning');
    if (select jsonb_object_agg(k,value->'revision') from jsonb_each(manifest) as m(k,value)) is distinct from payload->'expected_revisions' then
      return jsonb_build_object('error','ai_inputs_changed'); end if;
    if not app.ai_core_ready(snapshot) then return jsonb_build_object('error','ai_inputs_incomplete'); end if;
    if payload ? 'workflow_input' then
      if not exists(select 1 from app.records r where r.project_id=(payload->>'project_id')::uuid and r.section='design-solution'
        and r.revision=(payload#>>'{workflow_input,revision}')::integer)
        or not exists(select 1 from app.workflow_acceptances a join app.versions v on v.id=a.version_id
          join app.records r on r.project_id=a.project_id and r.section='analysis-brief' and r.revision=v.revision
          where a.project_id=(payload->>'project_id')::uuid and v.revision=(payload#>>'{workflow_input,brief_revision}')::integer)
      then return jsonb_build_object('error','ai_inputs_changed'); end if;
      snapshot:=snapshot||jsonb_build_object('workflow',payload->'workflow_input');
      manifest:=manifest||(select jsonb_object_agg(r.section,jsonb_build_object('version_id',v.id,'revision',r.revision))
        from app.records r join app.versions v on v.project_id=r.project_id and v.section=r.section and v.revision=r.revision
        where r.project_id=(payload->>'project_id')::uuid and r.section in ('analysis-brief','design-solution'));
    end if;
    amount:=(payload->>'allowance_microusd')::bigint;
    if amount is null or amount<=0 or amount>20000000 or coalesce(payload#>>'{policy,provider}','') not in ('simulated','openai')
      or coalesce(payload#>>'{policy,prompt_version}','')='' or jsonb_typeof(payload#>'{policy,steps}') is distinct from 'array' then
      return jsonb_build_object('error','invalid_request'); end if;
    if jsonb_array_length(payload#>'{policy,steps}') not between 1 and 3 then return jsonb_build_object('error','invalid_request'); end if;
    select coalesce(sum((s->>'max_microusd')::bigint),0),
      bool_or(s->>'key' not in ('generate','review','repair') or (s->>'max_microusd')::bigint<0)
      into max_cost,invalid from jsonb_array_elements(payload#>'{policy,steps}') s;
    if invalid or max_cost>amount or max_cost<=0 or payload#>>'{policy,steps,0,key}'<>'generate'
      or (jsonb_array_length(payload#>'{policy,steps}')>=2 and payload#>>'{policy,steps,1,key}' is distinct from 'review')
      or (jsonb_array_length(payload#>'{policy,steps}')=3 and payload#>>'{policy,steps,2,key}' is distinct from 'repair')
      or (select count(distinct s->>'key') from jsonb_array_elements(payload#>'{policy,steps}') s)<>jsonb_array_length(payload#>'{policy,steps}') then
      return jsonb_build_object('error','invalid_request'); end if;
    select coalesce(sum(x.reserved_microusd),0) into reserved from app.ai_jobs x where x.period_id=p.id;
    if p.spent_microusd+reserved+amount>20000000 then return jsonb_build_object('error','ai_budget_exceeded'); end if;
    if payload->>'retry_of' is not null then
      select * into old_job from app.ai_jobs x where x.id=(payload->>'retry_of')::uuid and x.owner_id=actor
        and x.project_id=(payload->>'project_id')::uuid and x.state='failed';
      if not found or old_job.input_manifest<>manifest or old_job.policy<>payload->'policy' then
        return jsonb_build_object('error','invalid_retry'); end if;
    end if;
    insert into app.ai_jobs(owner_id,project_id,request_id,request,input_snapshot,input_manifest,policy,allowance_microusd,retry_of)
      values(actor,(payload->>'project_id')::uuid,(payload->>'request_id')::uuid,intent,snapshot,manifest,payload->'policy',amount,old_job.id) returning * into j;
    insert into app.ai_job_inputs select j.id,(value->>'version_id')::uuid from jsonb_each(manifest);
    if old_job.id is not null then
      insert into app.ai_calls(id,job_id,step,state,max_microusd,actual_microusd,result,reused_from,finished_at)
        select gen_random_uuid(),j.id,x.step,'reused',0,0,x.result,x.id,now_at from app.ai_calls x
        where x.job_id=old_job.id and x.state in ('completed','reused');
    end if;
    return jsonb_build_object('job_id',j.id,'state',j.state);
  elsif operation='job' then
    select x.* into j from app.ai_jobs x join app.projects pr on pr.id=x.project_id
      where x.id=(payload->>'job_id')::uuid and x.owner_id=actor and pr.owner_id=actor
        and x.project_id=(payload->>'project_id')::uuid;
    if not found then return jsonb_build_object('error','not_found'); end if;
    select coalesce(jsonb_object_agg(x.step,x.result),'{}') into output from app.ai_calls x
      where x.job_id=j.id and x.state in ('completed','reused');
    return jsonb_build_object('job',jsonb_build_object('id',j.id,'project_id',j.project_id,'state',j.state,
      'task',j.policy->>'task','mode',j.policy->>'provider','input_manifest',j.input_manifest,'result',j.result,'artifacts',output,'failure',j.failure,
      'created_at',j.created_at,'updated_at',j.updated_at,
      'inputs_changed',exists(select 1 from app.records r where r.project_id=j.project_id
        and r.revision<>(j.input_manifest#>>array[r.section,'revision'])::integer)));
  elsif operation='claim' then
    if ctl.pause_reason is not null then return jsonb_build_object('error','ai_cost_pending'); end if;
    if ctl.active_job is not null then
      select * into j from app.ai_jobs x where x.id=ctl.active_job;
      if j.lease_until>now_at then return jsonb_build_object('error','ai_busy'); end if;
      if exists(select 1 from app.ai_calls x where x.job_id=j.id and x.state in ('started','uncertain')) then
        update app.ai_jobs set state='cost_pending',claim_token=null,updated_at=now_at where id=j.id;
        update app.ai_calls set state='uncertain' where job_id=j.id and state='started';
        update app.ai_control set pause_reason='cost_confirmation_pending',fence=fence+1 where id=1;
        return jsonb_build_object('error','ai_cost_pending');
      end if;
      if not exists(select 1 from app.projects pr join app.pilot_access m on m.user_id=pr.owner_id and m.active where pr.id=j.project_id and pr.owner_id=j.owner_id)
        or not exists(select 1 from app.ai_periods b where b.id=j.period_id and b.starts_at<=now_at and b.ends_at>now_at) then
        update app.ai_jobs set state='failed',failure='access_or_period_unavailable',reserved_microusd=0,claim_token=null,updated_at=now_at where id=j.id;
        update app.ai_control set active_job=null,fence=fence+1 where id=1;
        return jsonb_build_object('cancelled',j.id);
      end if;
      -- The same logical job/reservation resumes; completed steps are not reissued.
    else
      loop
        select * into j from app.ai_jobs x where x.state='queued' order by x.created_at,x.id limit 1;
        if not found then return jsonb_build_object('idle',true); end if;
        if exists(select 1 from app.projects pr join app.pilot_access m on m.user_id=pr.owner_id and m.active where pr.id=j.project_id and pr.owner_id=j.owner_id)
          and app.ai_core_ready(j.input_snapshot) then exit; end if;
        update app.ai_jobs set state='cancelled',failure='access_or_input_unavailable',updated_at=now_at where id=j.id;
      end loop;
      select * into p from app.ai_periods b where b.starts_at<=now_at and b.ends_at>now_at;
      if not found then return jsonb_build_object('error','ai_budget_unconfigured'); end if;
      select coalesce(sum(x.reserved_microusd),0) into reserved from app.ai_jobs x where x.period_id=p.id;
      if p.spent_microusd+reserved+j.allowance_microusd>20000000 then return jsonb_build_object('error','ai_budget_exceeded'); end if;
      update app.ai_jobs set period_id=p.id,reserved_microusd=allowance_microusd where id=j.id;
    end if;
    update app.ai_control set active_job=j.id,fence=fence+1 where id=1 returning * into ctl;
    update app.ai_jobs set state='running',claim_token=(payload->>'claim_token')::uuid,fence=ctl.fence,
      lease_until=now_at+interval '180 seconds',updated_at=now_at where id=j.id returning * into j;
    return jsonb_build_object('job',to_jsonb(j));
  elsif operation='outcome' then
    -- Late workers may save an already-produced outcome, but cannot acquire a
    -- new paid-call permit. A cost-pending job still needs operator reconciliation.
    select * into c from app.ai_calls x where x.id=(payload->>'call_id')::uuid;
    if not found or c.state='reused' then return jsonb_build_object('error','invalid_request'); end if;
    select * into j from app.ai_jobs x where x.id=c.job_id;
    if c.outcome is not null and c.state in ('completed','failed') then
      if c.outcome<>(case when j.project_id is null then payload-'result' else payload end) then return jsonb_build_object('error','operation_reused'); end if;
      return jsonb_build_object('ok',true);
    end if;
    amount:=(payload->>'actual_microusd')::bigint;
    if payload->>'state' is null or payload->>'state' not in ('completed','failed','uncertain') or amount<0 then return jsonb_build_object('error','invalid_request'); end if;
    output:=case when j.project_id is not null then payload->'result' else null end;
    if j.state='cost_pending' or c.state='uncertain' or payload->>'state'='uncertain'
      or amount is null or amount>c.max_microusd or amount>j.reserved_microusd then
      update app.ai_calls set state='uncertain',result=output,observed_microusd=amount,
        outcome=payload-'result',failure='cost_confirmation_pending' where id=c.id;
      update app.ai_jobs set state='cost_pending',claim_token=null,updated_at=now_at where id=j.id;
      update app.ai_control set active_job=j.id,pause_reason='cost_confirmation_pending',fence=fence+1 where id=1;
      return jsonb_build_object('error','ai_cost_pending');
    end if;
    update app.ai_calls set state=payload->>'state',actual_microusd=amount,result=output,
      failure=case when payload->>'state'='failed' then 'provider_failure' else null end,
      outcome=case when j.project_id is not null then payload else payload-'result' end,finished_at=now_at where id=c.id;
    update app.ai_periods set spent_microusd=spent_microusd+amount where id=j.period_id;
    update app.ai_jobs set reserved_microusd=reserved_microusd-amount,updated_at=now_at where id=j.id;
    return jsonb_build_object('ok',true);
  elsif operation='reconcile' then
    select * into j from app.ai_jobs x where x.id=(payload->>'job_id')::uuid and x.state='cost_pending';
    select * into c from app.ai_calls x where x.job_id=j.id and x.state='uncertain';
    amount:=(payload->>'actual_microusd')::bigint;
    if j.id is null or c.id is null or ctl.active_job is distinct from j.id
      or payload->>'worker_stopped' is distinct from 'true' or coalesce(btrim(payload->>'reference'),'')=''
      or amount is null or amount<0 then return jsonb_build_object('error','invalid_reconciliation'); end if;
    update app.ai_calls set state=case when result is not null and result<>'null'::jsonb then 'completed' else 'failed' end,
      actual_microusd=amount,reconciliation_reference=payload->>'reference',finished_at=now_at where id=c.id;
    update app.ai_periods set spent_microusd=spent_microusd+amount where id=j.period_id;
    select x.result into output from app.ai_calls x where x.job_id=j.id and x.step='generate' and x.state in ('completed','reused');
    -- Reconciliation never resumes paid work. A partial pipeline is a failed job
    -- with recoverable artifacts; an explicit retry can reuse those artifacts.
    update app.ai_jobs set state='failed',failure='reconciled_explicit_retry_required',reserved_microusd=0,
      claim_token=null,result=output,updated_at=now_at where id=j.id;
    update app.ai_control set active_job=null,pause_reason=case when amount>c.max_microusd then 'cost_overrun' else null end,
      fence=fence+1 where id=1;
    return jsonb_build_object('ok',true);
  elsif operation in ('begin_call','finish','heartbeat') then
    select * into j from app.ai_jobs x where x.id=(payload->>'job_id')::uuid;
    if j.id is null or ctl.active_job is distinct from j.id or j.state<>'running'
      or j.claim_token is distinct from (payload->>'claim_token')::uuid or j.fence<>ctl.fence or j.lease_until<=now_at then
      return jsonb_build_object('error','ai_claim_lost'); end if;
    if operation='heartbeat' then
      update app.ai_jobs set lease_until=now_at+interval '180 seconds' where id=j.id;
      return jsonb_build_object('ok',true);
    elsif operation='finish' then
      if exists(select 1 from app.ai_calls x where x.job_id=j.id and x.state in ('started','uncertain')) then return jsonb_build_object('error','ai_cost_pending'); end if;
      if payload->>'success'='true' and (
        not exists(select 1 from app.ai_calls x where x.job_id=j.id and x.step='generate' and x.state in ('completed','reused'))
        or exists(select 1 from jsonb_array_elements(j.policy->'steps') s where s->>'key'='review'
          and not exists(select 1 from app.ai_calls x where x.job_id=j.id and x.step='review' and x.state in ('completed','reused')))
        or exists(select 1 from app.ai_calls x where x.job_id=j.id and x.step='review' and x.result->>'needs_repair'='true'
          and not exists(select 1 from app.ai_calls a where a.job_id=j.id and a.step='repair' and a.state in ('completed','reused')))
        or exists(select 1 from app.ai_calls x where x.job_id=j.id and x.state='failed')
      ) then return jsonb_build_object('error','ai_step_blocked'); end if;
      select x.result into output from app.ai_calls x where x.job_id=j.id and x.state in ('completed','reused')
        and x.step in ('generate','repair') order by case when x.step='repair' then 0 else 1 end limit 1;
      invalid:=not exists(select 1 from app.projects pr join app.pilot_access m on m.user_id=pr.owner_id and m.active where pr.id=j.project_id and pr.owner_id=j.owner_id);
      update app.ai_jobs set state=case when invalid then 'cancelled' when payload->>'success'='true' and output is not null then 'completed' else 'failed' end,
        result=case when project_id is not null then output else null end,
        failure=case when invalid then 'access_unavailable' when payload->>'success'='true' then null else 'pipeline_failed' end,
        reserved_microusd=0,claim_token=null,updated_at=now_at where id=j.id returning * into j;
      update app.ai_control set active_job=null where id=1;
      return jsonb_build_object('job_id',j.id,'state',j.state);
    end if;
    if not exists(select 1 from app.projects pr join app.pilot_access m on m.user_id=pr.owner_id and m.active where pr.id=j.project_id and pr.owner_id=j.owner_id)
      or not app.ai_core_ready(j.input_snapshot) then return jsonb_build_object('error','unauthorized'); end if;
    if not exists(select 1 from app.ai_periods b where b.id=j.period_id and b.starts_at<=now_at and b.ends_at>now_at) then
      return jsonb_build_object('error','ai_period_closed'); end if;
    step_key:=payload->>'step';
    select s into step_config from jsonb_array_elements(j.policy->'steps') s where s->>'key'=step_key;
    if step_config is null then return jsonb_build_object('error','invalid_request'); end if;
    select * into c from app.ai_calls x where x.job_id=j.id and x.step=step_key;
    if found then return jsonb_build_object('execute',false,'call',to_jsonb(c)); end if;
    if exists(select 1 from app.ai_calls x where x.job_id=j.id and x.state in ('started','uncertain','failed')) then
      return jsonb_build_object('error','ai_step_blocked'); end if;
    if step_key<>'generate' and not exists(select 1 from app.ai_calls x where x.job_id=j.id and x.step='generate' and x.state in ('completed','reused')) then
      return jsonb_build_object('error','ai_step_blocked'); end if;
    if step_key='repair' and not exists(select 1 from app.ai_calls x where x.job_id=j.id and x.step='review'
      and x.state in ('completed','reused') and x.result->>'needs_repair'='true') then return jsonb_build_object('error','ai_step_blocked'); end if;
    max_cost:=(step_config->>'max_microusd')::bigint;
    if max_cost>j.reserved_microusd then return jsonb_build_object('error','ai_budget_exceeded'); end if;
    insert into app.ai_calls(id,job_id,step,state,max_microusd)
      values((payload->>'call_id')::uuid,j.id,step_key,'started',max_cost) returning * into c;
    return jsonb_build_object('execute',true,'call',to_jsonb(c));
  end if;
  return jsonb_build_object('error','invalid_request');
end $$;

revoke all on function public.ai_rpc(text,jsonb) from public;
revoke all on function app.ai_core_ready(jsonb) from public;
revoke all on function app.ai_clear_deleted_content() from public;
do $$ begin
  if exists(select 1 from pg_roles where rolname='anon') then
    revoke all on all tables in schema app from anon;
    revoke all on function public.ai_rpc(text,jsonb) from anon;
  end if;
  if exists(select 1 from pg_roles where rolname='authenticated') then
    revoke all on all tables in schema app from authenticated;
    revoke all on function public.ai_rpc(text,jsonb) from authenticated;
  end if;
  if exists(select 1 from pg_roles where rolname='service_role') then
    grant execute on function public.ai_rpc(text,jsonb) to service_role;
  end if;
end $$;
commit;
