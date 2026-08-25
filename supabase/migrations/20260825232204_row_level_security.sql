-- ============================================================
-- ClientFlow — Row Level Security
-- ============================================================

-- ------------------------------------------------------------
-- Helper: comprobar pertenencia a un workspace
-- SECURITY DEFINER evita recursión al consultar
-- workspace_members desde sus propias policies.
-- ------------------------------------------------------------

create or replace function public.is_workspace_member(
    target_workspace_id uuid
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
        where wm.workspace_id = target_workspace_id
          and wm.user_id = auth.uid()
    );
$$;

-- ------------------------------------------------------------
-- Helper: comprobar rol
-- ------------------------------------------------------------

create or replace function public.has_workspace_role(
    target_workspace_id uuid,
    allowed_roles text[]
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
        where wm.workspace_id = target_workspace_id
          and wm.user_id = auth.uid()
          and wm.role = any(allowed_roles)
    );
$$;

-- No necesitamos exponer estas funciones al público.
revoke all on function public.is_workspace_member(uuid) from public;
revoke all on function public.has_workspace_role(uuid, text[]) from public;

grant execute on function public.is_workspace_member(uuid) to authenticated;
grant execute on function public.has_workspace_role(uuid, text[]) to authenticated;


-- ============================================================
-- ENABLE RLS
-- ============================================================

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.clients enable row level security;
alter table public.projects enable row level security;
alter table public.deliverables enable row level security;
alter table public.project_files enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;


-- ============================================================
-- PROFILES
-- Cada usuario administra su propio perfil.
-- ============================================================

create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (id = auth.uid());

create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (id = auth.uid());

create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());


-- ============================================================
-- WORKSPACES
-- Un usuario puede crear un workspace.
-- Solo miembros pueden leerlo.
-- Owner/admin pueden modificarlo.
-- ============================================================

create policy "workspaces_select_member"
on public.workspaces
for select
to authenticated
using (public.is_workspace_member(id));

create policy "workspaces_insert_authenticated"
on public.workspaces
for insert
to authenticated
with check (true);

create policy "workspaces_update_admin"
on public.workspaces
for update
to authenticated
using (
    public.has_workspace_role(
        id,
        array['owner', 'admin']
    )
)
with check (
    public.has_workspace_role(
        id,
        array['owner', 'admin']
    )
);

create policy "workspaces_delete_owner"
on public.workspaces
for delete
to authenticated
using (
    public.has_workspace_role(
        id,
        array['owner']
    )
);


-- ============================================================
-- WORKSPACE MEMBERS
-- ============================================================

create policy "workspace_members_select_member"
on public.workspace_members
for select
to authenticated
using (
    public.is_workspace_member(workspace_id)
);

-- Bootstrap:
-- permite que un usuario se convierta en owner SOLO cuando
-- el workspace todavía no tiene miembros.
create policy "workspace_members_bootstrap_owner"
on public.workspace_members
for insert
to authenticated
with check (
    user_id = auth.uid()
    and role = 'owner'
    and not exists (
        select 1
        from public.workspace_members existing
        where existing.workspace_id = workspace_id
    )
);

-- Owners/admins pueden añadir miembros.
create policy "workspace_members_insert_admin"
on public.workspace_members
for insert
to authenticated
with check (
    public.has_workspace_role(
        workspace_id,
        array['owner', 'admin']
    )
);

create policy "workspace_members_update_owner"
on public.workspace_members
for update
to authenticated
using (
    public.has_workspace_role(
        workspace_id,
        array['owner']
    )
)
with check (
    public.has_workspace_role(
        workspace_id,
        array['owner']
    )
);

create policy "workspace_members_delete_owner"
on public.workspace_members
for delete
to authenticated
using (
    public.has_workspace_role(
        workspace_id,
        array['owner']
    )
);


-- ============================================================
-- CLIENTS
-- ============================================================

create policy "clients_workspace_access"
on public.clients
for all
to authenticated
using (
    public.is_workspace_member(workspace_id)
)
with check (
    public.is_workspace_member(workspace_id)
);


-- ============================================================
-- PROJECTS
-- ============================================================

create policy "projects_workspace_access"
on public.projects
for all
to authenticated
using (
    public.is_workspace_member(workspace_id)
)
with check (
    public.is_workspace_member(workspace_id)
);


-- ============================================================
-- DELIVERABLES
-- workspace se obtiene mediante project.
-- ============================================================

create policy "deliverables_workspace_access"
on public.deliverables
for all
to authenticated
using (
    exists (
        select 1
        from public.projects p
        where p.id = deliverables.project_id
          and public.is_workspace_member(p.workspace_id)
    )
)
with check (
    exists (
        select 1
        from public.projects p
        where p.id = deliverables.project_id
          and public.is_workspace_member(p.workspace_id)
    )
);


-- ============================================================
-- PROJECT FILES
-- ============================================================

create policy "project_files_workspace_access"
on public.project_files
for all
to authenticated
using (
    exists (
        select 1
        from public.projects p
        where p.id = project_files.project_id
          and public.is_workspace_member(p.workspace_id)
    )
)
with check (
    uploaded_by = auth.uid()
    and exists (
        select 1
        from public.projects p
        where p.id = project_files.project_id
          and public.is_workspace_member(p.workspace_id)
    )
);


-- ============================================================
-- INVOICES
-- ============================================================

create policy "invoices_workspace_access"
on public.invoices
for all
to authenticated
using (
    public.is_workspace_member(workspace_id)
)
with check (
    public.is_workspace_member(workspace_id)
);


-- ============================================================
-- INVOICE ITEMS
-- workspace se obtiene mediante invoice.
-- ============================================================

create policy "invoice_items_workspace_access"
on public.invoice_items
for all
to authenticated
using (
    exists (
        select 1
        from public.invoices i
        where i.id = invoice_items.invoice_id
          and public.is_workspace_member(i.workspace_id)
    )
)
with check (
    exists (
        select 1
        from public.invoices i
        where i.id = invoice_items.invoice_id
          and public.is_workspace_member(i.workspace_id)
    )
);
