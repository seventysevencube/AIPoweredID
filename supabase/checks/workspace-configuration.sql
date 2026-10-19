-- Read-only operator check. Run after both workspace migrations.
select
  (select count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='app' and c.relkind='r') as app_tables,
  (select count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='app' and c.relkind='r' and c.relrowsecurity) as tables_with_rls,
  (select count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='app' and c.relkind='r' and (has_table_privilege('anon',c.oid,'SELECT,INSERT,UPDATE,DELETE') or has_table_privilege('authenticated',c.oid,'SELECT,INSERT,UPDATE,DELETE'))) as browser_table_grants,
  has_schema_privilege('anon','app','USAGE') as anon_schema_access,
  has_schema_privilege('authenticated','app','USAGE') as signed_in_schema_access,
  has_function_privilege('anon','public.app_rpc(text,jsonb)','EXECUTE') as anon_rpc_access,
  has_function_privilege('authenticated','public.app_rpc(text,jsonb)','EXECUTE') as signed_in_rpc_access,
  has_function_privilege('service_role','public.app_rpc(text,jsonb)','EXECUTE') as backend_rpc_access,
  exists(select 1 from pg_trigger where tgname='retain_section_versions' and tgrelid='app.versions'::regclass and tgenabled='O') as retention_enabled,
  public.app_rpc('session',jsonb_build_object('user_id',gen_random_uuid(),'session_id',gen_random_uuid()))->>'error' as unadmitted_session_result;
