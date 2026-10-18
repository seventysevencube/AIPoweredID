begin;

-- Keep the latest ten ordinary section versions. Preserve exact-version references
-- separately so pruning drafts cannot change a review or an accepted handoff.
create function app.prune_section_versions(target_project uuid, target_section text)
returns void language sql set search_path='' as $$
  delete from app.versions v
  where v.project_id=target_project and v.section=target_section
    and v.id in (
      select older.id from app.versions older
      where older.project_id=target_project and older.section=target_section
      order by older.revision desc offset 10
    )
    and not exists(select 1 from app.reviews r where r.version_id=v.id)
    and not exists(select 1 from app.baseline_versions b where b.version_id=v.id);
$$;
revoke all on function app.prune_section_versions(uuid,text) from public;

create function app.prune_versions_after_insert()
returns trigger language plpgsql set search_path='' as $$
begin
  perform app.prune_section_versions(new.project_id,new.section);
  return new;
end $$;
revoke all on function app.prune_versions_after_insert() from public;

create trigger retain_section_versions after insert on app.versions
for each row execute function app.prune_versions_after_insert();

-- Apply the same policy to sections saved before this migration.
do $$ declare section_record record; begin
  for section_record in select project_id,section from app.records loop
    perform app.prune_section_versions(section_record.project_id,section_record.section);
  end loop;
end $$;

commit;
