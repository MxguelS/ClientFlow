-- with check adicional client_id → workspace
-- mediante EXISTS contra clients.

-- 1. Drop existing policy (was FOR ALL, USING+WITH CHECK en workspace_id)

drop policy if exists "invoices_workspace_access"
on public.invoices;


-- 2. Recreate con WITH CHECK que también valida client_id

create policy "invoices_workspace_access"
on public.invoices
for all
to authenticated

using (
    public.is_workspace_member(workspace_id)
)

with check (
    public.is_workspace_member(workspace_id)
    and exists (
        select 1
        from public.clients c
        where c.id = invoices.client_id
          and c.workspace_id = invoices.workspace_id
    )
);