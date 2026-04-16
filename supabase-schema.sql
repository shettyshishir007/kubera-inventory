-- =============================================
-- Sortly Inventory — Supabase Schema
-- Run this in Supabase SQL Editor
-- (Dashboard > SQL Editor > New Query)
-- =============================================

-- 1. Folders table
create table folders (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  color text not null default '#3b82f6',
  parent_id uuid references folders(id) on delete set null,
  user_id uuid references auth.users(id) on delete cascade not null default auth.uid(),
  created_at timestamptz default now()
);

-- 2. Items table
create table items (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  folder_id uuid references folders(id) on delete set null,
  quantity int not null default 0,
  min_quantity int not null default 5,
  price numeric not null default 0,
  tags text[] default '{}',
  notes text,
  image text,
  status text not null default 'in-stock' check (status in ('in-stock', 'low-stock', 'out-of-stock')),
  user_id uuid references auth.users(id) on delete cascade not null default auth.uid(),
  created_at timestamptz default now()
);

-- 3. Activity log table
create table activity_log (
  id uuid default gen_random_uuid() primary key,
  action text not null,
  item_name text not null,
  details text,
  user_id uuid references auth.users(id) on delete cascade not null default auth.uid(),
  created_at timestamptz default now()
);

-- 4. Enable Row Level Security
alter table folders enable row level security;
alter table items enable row level security;
alter table activity_log enable row level security;

-- 5. RLS Policies — users can only access their own data

-- Folders
create policy "Users can view own folders"
  on folders for select to authenticated
  using (user_id = auth.uid());

create policy "Users can insert own folders"
  on folders for insert to authenticated
  with check (user_id = auth.uid());

create policy "Users can update own folders"
  on folders for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "Users can delete own folders"
  on folders for delete to authenticated
  using (user_id = auth.uid());

-- Items
create policy "Users can view own items"
  on items for select to authenticated
  using (user_id = auth.uid());

create policy "Users can insert own items"
  on items for insert to authenticated
  with check (user_id = auth.uid());

create policy "Users can update own items"
  on items for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "Users can delete own items"
  on items for delete to authenticated
  using (user_id = auth.uid());

-- Activity log
create policy "Users can view own logs"
  on activity_log for select to authenticated
  using (user_id = auth.uid());

create policy "Users can insert own logs"
  on activity_log for insert to authenticated
  with check (user_id = auth.uid());

-- 6. Indexes for performance
create index idx_items_folder on items(folder_id);
create index idx_items_user on items(user_id);
create index idx_items_status on items(status);
create index idx_folders_user on folders(user_id);
create index idx_log_user on activity_log(user_id);
create index idx_log_created on activity_log(created_at desc);

-- 7. Function to auto-compute item status on insert/update
create or replace function compute_item_status()
returns trigger as $$
begin
  if NEW.quantity <= 0 then
    NEW.status := 'out-of-stock';
  elsif NEW.quantity <= NEW.min_quantity then
    NEW.status := 'low-stock';
  else
    NEW.status := 'in-stock';
  end if;
  return NEW;
end;
$$ language plpgsql;

create trigger item_status_trigger
  before insert or update of quantity, min_quantity on items
  for each row execute function compute_item_status();

-- 8. Seed sample data (will be owned by the first user who signs up)
-- Run these AFTER you create your first user account, replacing the user_id
-- Or skip this and add items through the UI
