-- ============================================================
-- ClientFlow — Workspace Invitations & Membership Safety
-- ============================================================
-- 1) Tabla de invitaciones (tokens NUNCA en texto plano: solo hash)
-- 2) Helper SECURITY DEFINER para listar miembros/invitaciones con
--    datos de auth.users inaccesibles para `authenticated`
-- 3) RPC de aceptación ATÓMICA (lock + estado + expiración + email)
-- 4) Trigger sobre workspace_members: anti-escalación en INSERT,
--    protección del último owner en UPDATE/DELETE
-- ============================================================

create table public.workspace_invitations (
    id uuid primary key default gen_random_uuid(),

    workspace_id uuid not null
        references public.workspaces(id) on delete cascade,

    email text not null,

    -- Las invitaciones nunca crean owners directamente.
    role text not null
        check (role in ('admin', 'member')),

    -- El servidor lo fija SIEMPRE: default = autor actual y el trigger
    -- de preparación lo sobreescribe con auth.uid() como blindaje extra
    -- frente a payloads manipulados vía API directa.
    invited_by uuid not null default auth.uid()
        references auth.users(id) on delete cascade,

    -- SHA-256 del token. El token crudo viaja SOLO en el enlace único
    -- mostrado una vez al administrador que invita.
    token_hash text not null unique,

    status text not null default 'pending'
        check (status in ('pending', 'accepted', 'revoked')),

    expires_at timestamptz not null default (now() + interval '7 days'),

    accepted_by uuid references auth.users(id) on delete set null,
    accepted_at timestamptz,

    created_at timestamptz not null default now()
);

create index idx_workspace_invitations_workspace
    on public.workspace_invitations(workspace_id);

-- Máximo UNA invitación pendiente por email/workspace. Al aceptar o
-- revocar se libera el slot automáticamente (índice parcial).
create unique index idx_workspace_invitations_pending_unique
    on public.workspace_invitations(workspace_id, lower(email))
    where status = 'pending';

alter table public.workspace_invitations enable row level security;


-- ------------------------------------------------------------
-- Helpers de autorización internos
-- ------------------------------------------------------------

-- Rol efectivo del llamador dentro del workspace indicado.
create function public.caller_workspace_role(
    p_workspace_id uuid
)
returns text
language sql
stable
security definer
set search_path = ''
as $$
    select wm.role
    from public.workspace_members wm
    where wm.workspace_id = p_workspace_id
      and wm.user_id = (select auth.uid())
    limit 1;
$$;

-- ¿Puede el llamador administrar el workspace? (owner | admin)
create function public.can_manage_workspace(
    p_workspace_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    select public.caller_workspace_role(p_workspace_id) in ('owner', 'admin');
$$;

revoke all on function public.caller_workspace_role(uuid) from public, anon;
revoke all on function public.can_manage_workspace(uuid) from public, anon;
grant execute on function public.caller_workspace_role(uuid) to authenticated;
grant execute on function public.can_manage_workspace(uuid) to authenticated;


-- ------------------------------------------------------------
-- Listado de miembros con perfil/email resueltos.
-- auth.users no es legible para `authenticated`; este helper lo hace
-- únicamente bajo verificación interna de pertenencia (auth.uid()).
-- Solo devuelve 0 filas si el llamador NO es miembro del workspace.
-- ------------------------------------------------------------

create function public.list_workspace_members(
    p_workspace_id uuid
)
returns table (
    user_id uuid,
    role text,
    full_name text,
    email text,
    joined_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
    select wm.user_id,
           wm.role,
           pr.full_name,
           lower(u.email),
           wm.created_at
    from public.workspace_members wm
    left join auth.users u on u.id = wm.user_id
    left join public.profiles pr on pr.id = wm.user_id
    where wm.workspace_id = p_workspace_id
      and exists (
          select 1
          from public.workspace_members caller
          where caller.user_id = (select auth.uid())
            and caller.workspace_id = wm.workspace_id
      )
    order by case wm.role when 'owner' then 0 when 'admin' then 1 else 2 end,
             wm.created_at asc;
$$;

revoke all on function public.list_workspace_members(uuid) from public, anon;
grant execute on function public.list_workspace_members(uuid) to authenticated;


-- ------------------------------------------------------------
-- Listado de invitaciones para owner/admin. Sin secretos.
-- ------------------------------------------------------------

create function public.list_workspace_invitations(
    p_workspace_id uuid
)
returns table (
    id uuid,
    email text,
    role text,
    status text,
    expires_at timestamptz,
    created_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
    select wi.id, wi.email, wi.role, wi.status,
           wi.expires_at, wi.created_at
    from public.workspace_invitations wi
    where wi.workspace_id = p_workspace_id
      and wi.status = 'pending'
      and public.can_manage_workspace(p_workspace_id)
    order by wi.created_at desc;
$$;

revoke all on function public.list_workspace_invitations(uuid) from public, anon;
grant execute on function public.list_workspace_invitations(uuid) to authenticated;


-- ------------------------------------------------------------
-- Policies RLS de workspace_invitations
-- ------------------------------------------------------------

create policy "workspace_invitations_select_managers"
on public.workspace_invitations
for select
to authenticated
using (
    public.can_manage_workspace(workspace_id)
);

create policy "workspace_invitations_insert_managers"
on public.workspace_invitations
for insert
to authenticated
with check (
    public.can_manage_workspace(workspace_id)
);

create policy "workspace_invitations_update_managers"
on public.workspace_invitations
for update
to authenticated
using (
    public.can_manage_workspace(workspace_id)
)
with check (
    public.can_manage_workspace(workspace_id)
);

create policy "workspace_invitations_delete_managers"
on public.workspace_invitations
for delete
to authenticated
using (
    public.can_manage_workspace(workspace_id)
);


-- ------------------------------------------------------------
-- Validación de creación de invitaciones (trigger BEFORE INSERT).
-- Normaliza email, fija invited_by/expiración en el SERVIDOR,
-- impide jerarquías indebidas y usuarios ya presentes.
-- ------------------------------------------------------------

create function public.prepare_workspace_invitation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_caller_role text;
    v_existing_user uuid;
begin
    -- Identidad y rol SIEMPRE desde el contexto de autenticación.
    v_caller_role := public.caller_workspace_role(new.workspace_id);

    if v_caller_role is null then
        raise exception 'not_a_member';
    end if;

    -- Normalización determinista del email.
    new.email := lower(btrim(new.email));

    -- El rol propuesto jamás puede exceder la jerarquía:
    -- admin solo puede invitar 'member'; owner puede invitar ambos.
    if new.role = 'admin' and v_caller_role <> 'owner' then
        raise exception 'role_not_allowed_for_caller';
    end if;

    -- invited_by/expiry fijados por el servidor, nunca por el cliente.
    new.invited_by := (select auth.uid());
    new.expires_at := now() + interval '7 days';

    -- No invitar a alguien que ya es miembro del workspace.
    select u.id into v_existing_user
    from auth.users u
    where lower(u.email) = new.email
    limit 1;

    if v_existing_user is not null and exists (
        select 1 from public.workspace_members wm
        where wm.workspace_id = new.workspace_id
          and wm.user_id = v_existing_user
    ) then
        raise exception 'already_a_member';
    end if;

    return new;
end;
$$;

revoke all on function public.prepare_workspace_invitation() from public, anon;

create trigger workspace_invitations_prepare
before insert on public.workspace_invitations
for each row
execute function public.prepare_workspace_invitation();


-- ------------------------------------------------------------
-- ACEPTACIÓN ATÓMICA de invitación.
--   • token crudo llega por parámetro; localización por hash
--   • pg_advisory_xact_lock serializa intentos simultáneos del token
--   • estado/expiración/validados tras el lock (race-safe)
--   • email de la sesión DEBE coincidir con el email invitado
--   • rol tomado SIEMPRE de la fila (nunca del cliente)
--   • rechaza cuentas que ya pertenezcan a otro workspace (el producto
--     asume hoy exactamente un workspace por usuario)
-- Devuelve el workspace_id incorporado.
-- ------------------------------------------------------------

create function public.accept_workspace_invitation(
    p_token text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_user_id uuid;
    v_email text;
    v_inv public.workspace_invitations%rowtype;
begin
    select u.id, lower(u.email)
    into v_user_id, v_email
    from auth.users u
    where u.id = (select auth.uid());

    if v_user_id is null then
        raise exception 'cf_not_authenticated';
    end if;

    -- Serializa aceptaciones concurrentes del mismo token.
    perform pg_advisory_xact_lock(hashtext(p_token));

    select * into v_inv
    from public.workspace_invitations wi
    where wi.token_hash = encode(extensions.digest(p_token::bytea, 'sha256'), 'hex')
      and wi.status = 'pending'
    for update;

    if not found then
        raise exception 'cf_invalid_or_used_token';
    end if;

    if v_inv.expires_at <= now() then
        raise exception 'cf_invitation_expired';
    end if;

    if v_email is distinct from v_inv.email then
        raise exception 'cf_email_mismatch';
    end if;

    if exists (
        select 1 from public.workspace_members wm
        where wm.user_id = v_user_id
    ) then
        raise exception 'cf_user_already_in_workspace';
    end if;

    -- membership + marcado de la invitación: MISMA transacción ⇒ atómico.
    insert into public.workspace_members (workspace_id, user_id, role)
    values (v_inv.workspace_id, v_user_id, v_inv.role);

    update public.workspace_invitations
    set status = 'accepted',
        accepted_by = v_user_id,
        accepted_at = now()
    where id = v_inv.id;

    return v_inv.workspace_id;
end;
$$;

revoke all on function public.accept_workspace_invitation(text)
from public, anon;
grant execute on function public.accept_workspace_invitation(text)
to authenticated;


-- ------------------------------------------------------------
-- Seguridad de membresías existentes.
-- Trigger compartido para workspace_members:
--   INSERT : bloquea la creación no-bootstrap de owners
--            (cierra la escalación preexistente admin→crea-owner)
--   UPDATE : impide degradar al último owner
--   DELETE : impide eliminar al último owner
-- Un advisory lock por workspace evita carreras entre operaciones
-- simultáneas sobre distintos owners del mismo workspace.
-- ------------------------------------------------------------

create function public.guard_workspace_membership()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_ws uuid;
    v_caller_role text;
    v_other_owners int;
begin
    v_ws :=
        case
            when tg_op in ('UPDATE', 'DELETE') then old.workspace_id
            else new.workspace_id
        end;

    perform pg_advisory_xact_lock(hashtextextended(v_ws::text, 42));

    -- Rol efectivo del llamador sobre ESTE workspace (old/new según op).
    v_caller_role := public.caller_workspace_role(v_ws);

    if tg_op = 'INSERT' then
        -- Bootstrap exclusivo del primer owner: auto-alta en workspace vacío.
        if new.role = 'owner' then
            if not (
                new.user_id = (select auth.uid())
                and not exists (
                    select 1 from public.workspace_members wm
                    where wm.workspace_id = new.workspace_id
                )
            ) then
                raise exception 'cf_owner_creation_not_allowed';
            end if;
        elsif new.role = 'admin' then
            -- Jerarquía: solo un OWNER puede crear administradores,
            -- con o sin invitación de por medio.
            if v_caller_role <> 'owner' then
                raise exception 'cf_admin_creation_requires_owner';
            end if;
        end if;
        return new;
    end if;

    if old.role <> 'owner' then
        -- Solo las filas de owner requieren protección extra aquí.
        if tg_op = 'DELETE' then return old; else return new; end if;
    end if;

    select count(*) into v_other_owners
    from public.workspace_members wm
    where wm.workspace_id = v_ws
      and wm.role = 'owner'
      and wm.user_id <> old.user_id;

    if v_other_owners = 0 then
        raise exception 'cf_last_owner_protected';
    end if;

    if tg_op = 'DELETE' then
        return old;
    end if;

    return new;
end;
$$;

revoke all on function public.guard_workspace_membership() from public, anon;

create trigger workspace_membership_guard
before insert or update or delete on public.workspace_members
for each row
execute function public.guard_workspace_membership();


-- ------------------------------------------------------------
-- Garantías de exposición vía PostgREST:
-- nuevas tablas NO se auto-exponen; estos grants son la única vía.
--   SELECT  : sin token_hash (secreto jamás listable)
--   INSERT  : columnas seguras; invited_by (default auth.uid()) y expiry
--             los reafirma el trigger; token_hash lo aporta la acción de
--             servidor ya autorizada, bajo RLS owner/admin.
--   UPDATE  : únicamente status (revocación)
-- ------------------------------------------------------------

grant select (id, workspace_id, email, role, status, expires_at,
              accepted_by, accepted_at, created_at)
on table public.workspace_invitations to authenticated;

grant insert (workspace_id, email, role, token_hash)
on table public.workspace_invitations to authenticated;

grant update (status)
on table public.workspace_invitations to authenticated;