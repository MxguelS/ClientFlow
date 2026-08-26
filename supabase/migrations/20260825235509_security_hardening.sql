-- ============================================================
-- ClientFlow — Security & Performance Hardening
-- ============================================================

-- ------------------------------------------------------------
-- 1. Helper functions
-- Estas funciones son internas para RLS.
-- No deben exponerse como RPC a anon/authenticated.
-- ------------------------------------------------------------

-- Quitar acceso público/anónimo
revoke execute
on function public.is_workspace_member(uuid)
from public, anon;

revoke execute
on function public.has_workspace_role(uuid, text[])
from public, anon;

-- authenticated necesita ejecutar estos helpers
-- porque las políticas RLS dependen de ellos
grant execute
on function public.is_workspace_member(uuid)
to authenticated;

grant execute
on function public.has_workspace_role(uuid, text[])
to authenticated;


-- ============================================================
-- 2. PROFILES
-- Evita reevaluar auth.uid() por cada fila.
-- ============================================================

drop policy if exists "profiles_select_own"
on public.profiles;

create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (
    id = (select auth.uid())
);


drop policy if exists "profiles_insert_own"
on public.profiles;

create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (
    id = (select auth.uid())
);


drop policy if exists "profiles_update_own"
on public.profiles;

create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (
    id = (select auth.uid())
)
with check (
    id = (select auth.uid())
);


-- ============================================================
-- 3. WORKSPACE MEMBERS
-- Fusionamos las dos policies INSERT en una sola.
-- También optimizamos auth.uid().
-- ============================================================

drop policy if exists "workspace_members_bootstrap_owner"
on public.workspace_members;

drop policy if exists "workspace_members_insert_admin"
on public.workspace_members;


create policy "workspace_members_insert"
on public.workspace_members
for insert
to authenticated
with check (

    -- CASO 1:
    -- Owner inicial de un workspace vacío.
    (
        user_id = (select auth.uid())
        and role = 'owner'

        and not exists (
            select 1
            from public.workspace_members existing
            where existing.workspace_id =
                  workspace_members.workspace_id
        )
    )

    or

    -- CASO 2:
    -- Owner/Admin existente agrega miembros.
    public.has_workspace_role(
        workspace_id,
        array['owner', 'admin']
    )
);


-- ============================================================
-- 4. PROJECT FILES
-- Optimizar auth.uid() utilizado por RLS.
-- ============================================================

drop policy if exists "project_files_workspace_access"
on public.project_files;


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
    uploaded_by = (select auth.uid())

    and exists (
        select 1
        from public.projects p
        where p.id = project_files.project_id
          and public.is_workspace_member(p.workspace_id)
    )
);


-- ============================================================
-- 5. INDEX
-- FK project_files.uploaded_by
-- ============================================================

create index if not exists idx_project_files_uploaded_by
on public.project_files(uploaded_by);
