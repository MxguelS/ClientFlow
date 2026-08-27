-- ============================================================
-- ClientFlow — Project Files Storage project authorization
-- ============================================================
-- Storage policies need to validate both path segments. The helper
-- runs with a fixed search_path and only returns true when the
-- authenticated user belongs to the path workspace and the project
-- belongs to that workspace.
-- ============================================================

create function public.can_access_project_storage(
    path_workspace_id text,
    path_project_id text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    select exists (
        select 1
        from public.workspace_members wm
        join public.projects p
          on p.id::text = path_project_id
         and p.workspace_id = wm.workspace_id
        where wm.workspace_id::text = path_workspace_id
          and wm.user_id = (select auth.uid())
    );
$$;

revoke all on function public.can_access_project_storage(text, text)
from public, anon;

grant execute on function public.can_access_project_storage(text, text)
to authenticated;


drop policy if exists "project_files_select" on storage.objects;
drop policy if exists "project_files_insert" on storage.objects;
drop policy if exists "project_files_update" on storage.objects;
drop policy if exists "project_files_delete" on storage.objects;


create policy "project_files_select"
on storage.objects
for select
to authenticated
using (
    bucket_id = 'project-files'
    and cardinality(storage.foldername(name)) = 2
    and public.can_access_project_storage(
        (storage.foldername(name))[1],
        (storage.foldername(name))[2]
    )
);


create policy "project_files_insert"
on storage.objects
for insert
to authenticated
with check (
    bucket_id = 'project-files'
    and cardinality(storage.foldername(name)) = 2
    and public.can_access_project_storage(
        (storage.foldername(name))[1],
        (storage.foldername(name))[2]
    )
);


create policy "project_files_update"
on storage.objects
for update
to authenticated
using (
    bucket_id = 'project-files'
    and owner = (select auth.uid())
    and cardinality(storage.foldername(name)) = 2
    and public.can_access_project_storage(
        (storage.foldername(name))[1],
        (storage.foldername(name))[2]
    )
)
with check (
    bucket_id = 'project-files'
    and owner = (select auth.uid())
    and cardinality(storage.foldername(name)) = 2
    and public.can_access_project_storage(
        (storage.foldername(name))[1],
        (storage.foldername(name))[2]
    )
);


create policy "project_files_delete"
on storage.objects
for delete
to authenticated
using (
    bucket_id = 'project-files'
    and owner = (select auth.uid())
    and cardinality(storage.foldername(name)) = 2
    and public.can_access_project_storage(
        (storage.foldername(name))[1],
        (storage.foldername(name))[2]
    )
);
