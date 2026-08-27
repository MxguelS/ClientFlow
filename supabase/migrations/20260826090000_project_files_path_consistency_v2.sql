-- ============================================================
-- ClientFlow — Project Files Path Consistency (V2)
-- ============================================================
-- Requisitos:
--   1. storage_path debe tener como segmento 2 (project_id)
--      el mismo valor que project_files.project_id.
--   2. El segmento 1 (workspace_id) debe coincidir con el
--      workspace del proyecto.
--   3. Storage policies validan workspace_id (segmento 1).
--      La consistencia project_id se garantiza mediante
--      DB trigger, ya que storage policy no puede acceder
--      a public.projects bajo RLS.
-- ============================================================

-- ----------------------------------------------------------
-- 1. DB trigger — reemplaza la versión anterior
-- ----------------------------------------------------------

drop trigger if exists project_files_check_storage_path
on public.project_files;

drop function if exists public.check_project_file_storage_path();


create function public.check_project_file_storage_path()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
    ws_id text;
    proj_id_in_path text;
    proj_id_in_db text;
begin
    select p.workspace_id::text into ws_id
    from public.projects p
    where p.id = new.project_id;

    if ws_id is null then
        raise exception 'project not found';
    end if;

    proj_id_in_path := (string_to_array(new.storage_path, '/'))[2];
    proj_id_in_db := new.project_id::text;

    if new.storage_path !~ ('^' || ws_id || '/') then
        raise exception 'storage_path segment 1 (workspace) must be %', ws_id;
    end if;

    if proj_id_in_path is distinct from proj_id_in_db then
        raise exception 'storage_path segment 2 (project) must be %', proj_id_in_db;
    end if;

    return new;
end;
$$;


create trigger project_files_check_storage_path
before insert or update on public.project_files
for each row
execute function public.check_project_file_storage_path();


-- ----------------------------------------------------------
-- 2. Storage policies — workspace_id validation + owner control
--    La consistencia con project_id se delega al trigger DB.
--    storage.objects no puede acceder a public.projects
--    bajo RLS desde su contexto de policy.
-- ----------------------------------------------------------

drop policy if exists "project_files_select" on storage.objects;
drop policy if exists "project_files_insert" on storage.objects;
drop policy if exists "project_files_update" on storage.objects;
drop policy if exists "project_files_delete" on storage.objects;


-- SELECT: workspace member
create policy "project_files_select"
on storage.objects
for select
to authenticated
using (
    bucket_id = 'project-files'
    and (
        (storage.foldername(name))[1] in (
            select workspace_members.workspace_id::text
            from public.workspace_members
            where workspace_members.user_id = auth.uid()
        )
    )
);


-- INSERT: workspace member
create policy "project_files_insert"
on storage.objects
for insert
to authenticated
with check (
    bucket_id = 'project-files'
    and (
        (storage.foldername(name))[1] in (
            select workspace_members.workspace_id::text
            from public.workspace_members
            where workspace_members.user_id = auth.uid()
        )
    )
);


-- UPDATE: owner del objeto
create policy "project_files_update"
on storage.objects
for update
to authenticated
using (
    bucket_id = 'project-files'
    and owner = auth.uid()
)
with check (
    bucket_id = 'project-files'
    and owner = auth.uid()
);


-- DELETE: owner del objeto
create policy "project_files_delete"
on storage.objects
for delete
to authenticated
using (
    bucket_id = 'project-files'
    and owner = auth.uid()
);