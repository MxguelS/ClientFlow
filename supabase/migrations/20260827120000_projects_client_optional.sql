-- Projects may exist before a client relationship is available.
-- Keep workspace membership as the primary authorization boundary and retain
-- the foreign key for non-null client_id values.

alter table public.projects
    alter column client_id drop not null;

drop policy if exists "projects_insert_workspace_access" on public.projects;
drop policy if exists "projects_update_workspace_access" on public.projects;

create policy "projects_insert_workspace_access"
on public.projects
for insert
to authenticated
with check (
    public.is_workspace_member(workspace_id)
    and (
        client_id is null
        or exists (
            select 1
            from public.clients c
            where c.id = projects.client_id
              and c.workspace_id = projects.workspace_id
        )
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
    and (
        client_id is null
        or exists (
            select 1
            from public.clients c
            where c.id = projects.client_id
              and c.workspace_id = projects.workspace_id
        )
    )
);
