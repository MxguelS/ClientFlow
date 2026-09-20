# ClientFlow

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-20232A?logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/Vitest-tests-6E9F18?logo=vitest&logoColor=white" alt="Vitest" />
</p>

Plantilla SaaS para gestionar clientes, proyectos, entregables, facturas, archivos y equipos con autenticación y aislamiento de datos por workspace.

[Español](#español) · [English](#english)

## Español

ClientFlow es una base reutilizable para crear aplicaciones SaaS orientadas a clientes y proyectos. La plantilla incluye autenticación, workspaces, clientes, proyectos, entregables, facturación, archivos, invitaciones de equipo y políticas RLS.

### Incluye

- Autenticación y recuperación de contraseña.
- Gestión de workspaces, miembros y clientes.
- Proyectos, entregables y archivos.
- Facturas e items de facturación.
- Migraciones de Supabase y políticas RLS.
- Tests con Vitest.

### Inicio rápido

```bash
git clone https://github.com/MxguelS/ClientFlow.git
cd ClientFlow
pnpm install
cp .env.example .env.local
pnpm dev
```

Configura `.env.local` con tu propio proyecto de Supabase:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

Las migraciones de base de datos están en `supabase/migrations`.

### Comprobaciones

```bash
pnpm test
pnpm typecheck
pnpm lint
```

## English

ClientFlow is a reusable SaaS starter for client and project management applications. It includes authentication, workspaces, clients, projects, deliverables, invoicing, files, team invitations, and RLS policies.

### Included

- Authentication and password recovery.
- Workspace, member, and client management.
- Projects, deliverables, and files.
- Invoices and invoice items.
- Supabase migrations and RLS policies.
- Vitest test suite.

### Quick start

```bash
git clone https://github.com/MxguelS/ClientFlow.git
cd ClientFlow
pnpm install
cp .env.example .env.local
pnpm dev
```

Configure `.env.local` with your own Supabase project:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

Database migrations are available in `supabase/migrations`.

### Checks

```bash
pnpm test
pnpm typecheck
pnpm lint
```

## License

MIT
