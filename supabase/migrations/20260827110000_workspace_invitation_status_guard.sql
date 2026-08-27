-- A manager may only revoke a pending invitation through REST. The accepted
-- transition is reserved for the atomic RPC, which supplies both acceptance
-- metadata columns that authenticated users cannot update directly.
create function public.guard_workspace_invitation_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    if new.status = old.status then
        return new;
    end if;

    if old.status <> 'pending' then
        raise exception 'cf_invitation_status_transition_not_allowed';
    end if;

    if new.status = 'revoked'
       and new.accepted_by is null
       and new.accepted_at is null then
        return new;
    end if;

    if new.status = 'accepted'
       and new.accepted_by = (select auth.uid())
       and new.accepted_at is not null then
        return new;
    end if;

    raise exception 'cf_invitation_status_transition_not_allowed';
end;
$$;

revoke all on function public.guard_workspace_invitation_status()
from public, anon, authenticated;

create trigger workspace_invitations_status_guard
before update of status, accepted_by, accepted_at
on public.workspace_invitations
for each row
execute function public.guard_workspace_invitation_status();
