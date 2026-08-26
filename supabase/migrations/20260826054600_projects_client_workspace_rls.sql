-- Ensure projects cannot point at clients from another workspace, even when
-- written directly through the Supabase API.

drop policy if exists "projects_workspace_access" on public.projects;

create policy "projects_select_workspace_access"
on public.projects
for select
to authenticated
using (
    public.is_workspace_member(workspace_id)
);

create policy "projects_insert_workspace_access"
on public.projects
for insert
to authenticated
with check (
    public.is_workspace_member(workspace_id)
    and exists (
        select 1
        from public.clients c
        where c.id = projects.client_id
          and c.workspace_id = projects.workspace_id
    )
);

create policy "projects_update_workspace_access"
on public.projects
for update
to authenticated
using (
    public.is_workspace_member(workspace_id)
)
with check (
    public.is_workspace_member(workspace_id)
    and exists (
        select 1
        from public.clients c
        where c.id = projects.client_id
          and c.workspace_id = projects.workspace_id
    )
);

create policy "projects_delete_workspace_access"
on public.projects
for delete
to authenticated
using (
    public.is_workspace_member(workspace_id)
);
