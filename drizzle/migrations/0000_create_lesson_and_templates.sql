create table if not exists public.lesson_content (
  id text primary key,
  blocks jsonb not null,
  updated_at timestamptz not null default now()
);
create table if not exists public.templates (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'قالب جديد',
  category text not null default 'عام',
  width integer not null default 1080,
  height integer not null default 1080,
  background text not null default '#ffffff',
  elements jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  display_mode text not null default 'boxed',
  sort_order integer not null default 1000,
  is_system boolean not null default false
);
grant select, insert, update on public.lesson_content to anon, authenticated;
grant select, insert, update, delete on public.templates to anon, authenticated;
grant all on public.lesson_content to service_role;
grant all on public.templates to service_role;
alter table public.lesson_content enable row level security;
alter table public.templates enable row level security;
create policy "read lesson" on public.lesson_content for select to anon, authenticated using (true);
create policy "insert lesson" on public.lesson_content for insert to anon, authenticated with check (id = 'main');
create policy "update lesson" on public.lesson_content for update to anon, authenticated using (id = 'main') with check (id = 'main');
create policy "read templates" on public.templates for select to anon, authenticated using (true);
create policy "insert templates" on public.templates for insert to anon, authenticated with check (is_system = false);
create policy "update templates" on public.templates for update to anon, authenticated using (is_system = false) with check (is_system = false);
create policy "delete templates" on public.templates for delete to anon, authenticated using (is_system = false);