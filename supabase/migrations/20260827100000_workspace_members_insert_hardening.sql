-- ------------------------------------------------------------
-- Membership creation has exactly two application paths:
--   1. the first owner of an empty workspace (RLS bootstrap);
--   2. accept_workspace_invitation(), which is SECURITY DEFINER.
-- Direct REST inserts by existing members are not an application path.
-- ------------------------------------------------------------

drop policy if exists "workspace_members_insert"
on public.workspace_members;

create policy "workspace_members_bootstrap_owner_only"
on public.workspace_members
for insert
to authenticated
with check (
    user_id = (select auth.uid())
    and role = 'owner'
    and not exists (
        select 1
        from public.workspace_members existing
        where existing.workspace_id = workspace_members.workspace_id
    )
);

-- These helpers are used by SECURITY DEFINER triggers/policies internally.
-- They must not become callable PostgREST APIs.
revoke all on function public.caller_workspace_role(uuid)
from public, anon, authenticated;

revoke all on function public.can_manage_workspace(uuid)
from public, anon, authenticated;

-- Replace invitation policies that depended on the callable authorization
-- helper. Inline checks keep the policy self-contained after its EXECUTE is
-- revoked from authenticated.
drop policy if exists "workspace_invitations_select_managers"
on public.workspace_invitations;

drop policy if exists "workspace_invitations_insert_managers"
on public.workspace_invitations;

drop policy if exists "workspace_invitations_update_managers"
on public.workspace_invitations;

drop policy if exists "workspace_invitations_delete_managers"
on public.workspace_invitations;

create policy "workspace_invitations_select_managers"
on public.workspace_invitations
for select
to authenticated
using (
    exists (
        select 1
        from public.workspace_members wm
        where wm.workspace_id = workspace_invitations.workspace_id
          and wm.user_id = (select auth.uid())
          and wm.role in ('owner', 'admin')
    )
);

create policy "workspace_invitations_insert_managers"
on public.workspace_invitations
for insert
to authenticated
with check (
    exists (
        select 1
        from public.workspace_members wm
        where wm.workspace_id = workspace_invitations.workspace_id
          and wm.user_id = (select auth.uid())
          and wm.role in ('owner', 'admin')
    )
);

create policy "workspace_invitations_update_managers"
on public.workspace_invitations
for update
to authenticated
using (
    exists (
        select 1
        from public.workspace_members wm
        where wm.workspace_id = workspace_invitations.workspace_id
          and wm.user_id = (select auth.uid())
          and wm.role in ('owner', 'admin')
    )
)
with check (
    exists (
        select 1
        from public.workspace_members wm
        where wm.workspace_id = workspace_invitations.workspace_id
          and wm.user_id = (select auth.uid())
          and wm.role in ('owner', 'admin')
    )
);

create policy "workspace_invitations_delete_managers"
on public.workspace_invitations
for delete
to authenticated
using (
    exists (
        select 1
        from public.workspace_members wm
        where wm.workspace_id = workspace_invitations.workspace_id
          and wm.user_id = (select auth.uid())
          and wm.role in ('owner', 'admin')
    )
);
