-- ============================================================
-- ClientFlow — Project Files storage_path consistency
-- ============================================================
-- Garantiza que storage_path en project_files tenga como
-- prefijo el workspace_id del proyecto asociado, evitando
-- metadata inconsistente donde el path no corresponda al
-- proyecto real.
-- ============================================================

create or replace function public.check_project_file_storage_path()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
    ws_id text;
begin
    select p.workspace_id::text into ws_id
    from public.projects p
    where p.id = new.project_id;

    if ws_id is null then
        raise exception 'project not found';
    end if;

    if new.storage_path !~ ('^' || ws_id || '/') then
        raise exception 'storage_path must start with the project workspace_id (%)', ws_id;
    end if;

    return new;
end;
$$;

create trigger project_files_check_storage_path
before insert or update on public.project_files
for each row
execute function public.check_project_file_storage_path();