-- ============================================================
-- ClientFlow — Project Files Storage Bucket + Policies
-- ============================================================
-- Crea el bucket privado project-files y las policies de
-- storage.objects que validan workspace membership mediante
-- el prefijo del path: {workspace_id}/{project_id}/{uuid}
-- ============================================================

-- 1. Bucket privado
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
    'project-files',
    'project-files',
    false,
    '52428800', -- 50 MiB en bytes
    array[
        'application/pdf',
        'image/png',
        'image/jpeg',
        'image/gif',
        'image/webp',
        'image/svg+xml',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
        'text/csv',
        'text/markdown',
        'application/zip',
        'application/gzip',
        'application/x-rar-compressed'
    ]
)
on conflict (id) do nothing;


-- 2. Storage policies

-- SELECT: workspace member puede leer objetos del bucket
-- cuyo path comience con un workspace_id al que pertenece.
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


-- INSERT: workspace member puede subir a paths de su workspace.
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


-- UPDATE: solo el owner del objeto (quien lo subió).
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


-- DELETE: solo el owner del objeto.
create policy "project_files_delete"
on storage.objects
for delete
to authenticated
using (
    bucket_id = 'project-files'
    and owner = auth.uid()
);