-- =========================================================================
-- Lucius Budget — schéma de la base de données
-- À exécuter dans Supabase : Dashboard > SQL Editor > New query
-- =========================================================================

-- -------------------------------------------------------------------------
-- Table luciusbudget_entries
-- -------------------------------------------------------------------------
-- "luciusbudget_users" n'existe pas : on référence directement la table
-- native auth.users fournie par Supabase Auth (colonne author).

create table if not exists public.luciusbudget_entries (
  id          uuid primary key default gen_random_uuid(),
  date        timestamptz not null default now(),
  category    varchar(16) not null,
  label       varchar(32) not null,
  amount      numeric(10, 2) not null check (amount >= 0),
  is_income   boolean not null default false,
  author      uuid not null references auth.users (id) on delete cascade,
  created_at  timestamptz not null default now()
);

comment on table public.luciusbudget_entries is 'Entrées de budget (dépenses / revenus) de Lucius Budget';
comment on column public.luciusbudget_entries.date is 'Date/heure de l''entrée. Plafonnée à la fin du mois en cours par trigger.';
comment on column public.luciusbudget_entries.category is 'Catégorie (liste fixe gérée côté frontend)';
comment on column public.luciusbudget_entries.label is 'Étiquette libre décrivant l''entrée';
comment on column public.luciusbudget_entries.amount is 'Montant, toujours positif, à 2 décimales';
comment on column public.luciusbudget_entries.is_income is 'true = revenu, false = dépense';
comment on column public.luciusbudget_entries.author is 'Référence vers auth.users, non visible/éditable dans le formulaire';

-- Index utiles pour les requêtes de la page /budget (filtre par auteur + mois, tri par date)
create index if not exists luciusbudget_entries_author_date_idx
  on public.luciusbudget_entries (author, date);

-- -------------------------------------------------------------------------
-- Trigger : la date ne peut pas dépasser la fin du mois en cours
-- -------------------------------------------------------------------------
-- NOW() n'étant pas une fonction "immutable", on ne peut pas l'utiliser dans
-- une contrainte CHECK. On utilise donc un trigger BEFORE INSERT/UPDATE qui
-- plafonne automatiquement toute date dépassant la fin du mois courant.

create or replace function public.luciusbudget_clamp_entry_date()
returns trigger
language plpgsql
as $$
declare
  end_of_month timestamptz := date_trunc('month', now()) + interval '1 month' - interval '1 second';
begin
  if new.date is null then
    new.date := now();
  elsif new.date > end_of_month then
    new.date := end_of_month;
  end if;
  return new;
end;
$$;

drop trigger if exists luciusbudget_entries_clamp_date on public.luciusbudget_entries;

create trigger luciusbudget_entries_clamp_date
  before insert or update on public.luciusbudget_entries
  for each row
  execute function public.luciusbudget_clamp_entry_date();

-- -------------------------------------------------------------------------
-- Row Level Security : chaque utilisateur ne voit/modifie que ses entrées
-- -------------------------------------------------------------------------

alter table public.luciusbudget_entries enable row level security;

drop policy if exists "Select own entries" on public.luciusbudget_entries;
create policy "Select own entries"
  on public.luciusbudget_entries
  for select
  using (auth.uid() = author);

drop policy if exists "Insert own entries" on public.luciusbudget_entries;
create policy "Insert own entries"
  on public.luciusbudget_entries
  for insert
  with check (auth.uid() = author);

drop policy if exists "Update own entries" on public.luciusbudget_entries;
create policy "Update own entries"
  on public.luciusbudget_entries
  for update
  using (auth.uid() = author)
  with check (auth.uid() = author);

drop policy if exists "Delete own entries" on public.luciusbudget_entries;
create policy "Delete own entries"
  on public.luciusbudget_entries
  for delete
  using (auth.uid() = author);
