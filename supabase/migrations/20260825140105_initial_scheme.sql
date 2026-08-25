-- ============================================================
-- ClientFlow — Initial Database Schema
-- ============================================================

create extension if not exists "pgcrypto";

-- ============================================================
-- PROFILES
-- Extiende auth.users de Supabase.
-- ============================================================

create table public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    full_name text,
    avatar_url text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- ============================================================
-- WORKSPACES
-- Representa el negocio/espacio de trabajo.
-- ============================================================

create table public.workspaces (
    id uuid primary key default gen_random_uuid(),
    name text not null check (char_length(name) between 1 and 100),
    slug text not null unique,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- ============================================================
-- WORKSPACE MEMBERS
-- Relación usuarios <-> workspaces.
-- ============================================================

create table public.workspace_members (
    workspace_id uuid not null
        references public.workspaces(id) on delete cascade,

    user_id uuid not null
        references auth.users(id) on delete cascade,

    role text not null default 'member'
        check (role in ('owner', 'admin', 'member')),

    created_at timestamptz not null default now(),

    primary key (workspace_id, user_id)
);

-- ============================================================
-- CLIENTS
-- ============================================================

create table public.clients (
    id uuid primary key default gen_random_uuid(),

    workspace_id uuid not null
        references public.workspaces(id) on delete cascade,

    name text not null check (char_length(name) between 1 and 150),
    company text,
    email text,
    phone text,
    notes text,

    status text not null default 'active'
        check (status in ('active', 'inactive', 'lead')),

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- ============================================================
-- PROJECTS
-- ============================================================

create table public.projects (
    id uuid primary key default gen_random_uuid(),

    workspace_id uuid not null
        references public.workspaces(id) on delete cascade,

    client_id uuid not null
        references public.clients(id) on delete restrict,

    name text not null check (char_length(name) between 1 and 150),
    description text,

    status text not null default 'planning'
        check (
            status in (
                'planning',
                'active',
                'on_hold',
                'completed',
                'cancelled'
            )
        ),

    budget numeric(12,2)
        check (budget is null or budget >= 0),

    start_date date,
    due_date date,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    constraint project_dates_valid
        check (
            start_date is null
            or due_date is null
            or due_date >= start_date
        )
);

-- ============================================================
-- DELIVERABLES
-- ============================================================

create table public.deliverables (
    id uuid primary key default gen_random_uuid(),

    project_id uuid not null
        references public.projects(id) on delete cascade,

    title text not null check (char_length(title) between 1 and 200),
    description text,

    status text not null default 'pending'
        check (
            status in (
                'pending',
                'in_progress',
                'in_review',
                'approved'
            )
        ),

    due_date date,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- ============================================================
-- PROJECT FILES
-- Guarda metadata. El archivo real vivirá en Supabase Storage.
-- ============================================================

create table public.project_files (
    id uuid primary key default gen_random_uuid(),

    project_id uuid not null
        references public.projects(id) on delete cascade,

    uploaded_by uuid not null
        references auth.users(id) on delete restrict,

    file_name text not null,
    storage_path text not null unique,
    mime_type text,
    size_bytes bigint check (size_bytes is null or size_bytes >= 0),

    created_at timestamptz not null default now()
);

-- ============================================================
-- INVOICES
-- ============================================================

create table public.invoices (
    id uuid primary key default gen_random_uuid(),

    workspace_id uuid not null
        references public.workspaces(id) on delete cascade,

    client_id uuid not null
        references public.clients(id) on delete restrict,

    invoice_number text not null,

    status text not null default 'draft'
        check (
            status in (
                'draft',
                'sent',
                'paid',
                'overdue',
                'cancelled'
            )
        ),

    currency varchar(3) not null default 'USD',

    issue_date date not null default current_date,
    due_date date,

    notes text,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    unique (workspace_id, invoice_number),

    constraint invoice_dates_valid
        check (due_date is null or due_date >= issue_date)
);

-- ============================================================
-- INVOICE ITEMS
-- ============================================================

create table public.invoice_items (
    id uuid primary key default gen_random_uuid(),

    invoice_id uuid not null
        references public.invoices(id) on delete cascade,

    description text not null,

    quantity numeric(10,2) not null default 1
        check (quantity > 0),

    unit_price numeric(12,2) not null
        check (unit_price >= 0),

    created_at timestamptz not null default now()
);

-- ============================================================
-- INDEXES
-- ============================================================

create index idx_workspace_members_user
    on public.workspace_members(user_id);

create index idx_clients_workspace
    on public.clients(workspace_id);

create index idx_projects_workspace
    on public.projects(workspace_id);

create index idx_projects_client
    on public.projects(client_id);

create index idx_deliverables_project
    on public.deliverables(project_id);

create index idx_project_files_project
    on public.project_files(project_id);

create index idx_invoices_workspace
    on public.invoices(workspace_id);

create index idx_invoices_client
    on public.invoices(client_id);

create index idx_invoice_items_invoice
    on public.invoice_items(invoice_id);

-- ============================================================
-- UPDATED_AT
-- Evita depender de Next.js para actualizar timestamps.
-- ============================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger workspaces_set_updated_at
before update on public.workspaces
for each row execute function public.set_updated_at();

create trigger clients_set_updated_at
before update on public.clients
for each row execute function public.set_updated_at();

create trigger projects_set_updated_at
before update on public.projects
for each row execute function public.set_updated_at();

create trigger deliverables_set_updated_at
before update on public.deliverables
for each row execute function public.set_updated_at();

create trigger invoices_set_updated_at
before update on public.invoices
for each row execute function public.set_updated_at();
