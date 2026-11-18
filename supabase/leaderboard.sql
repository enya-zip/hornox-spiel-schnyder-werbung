-- Globale Rangliste für HORNOX RUN
-- Einmal im Supabase-Projekt ausführen: Dashboard → SQL Editor → New query → einfügen → Run.

-- 1) Tabelle: pro Spieler (eindeutige ID) der beste Lauf.
--    Rangfolge: erreichtes Level (höher zuerst), dann Punkte, bei Gleichstand wer früher dort war.
create table if not exists public.leaderboard (
  player_id  uuid primary key,
  name       text not null check (char_length(name) between 1 and 20),
  best_score integer not null default 0 check (best_score >= 0 and best_score <= 500000),
  best_level smallint not null default 1 check (best_level between 1 and 10),
  coins      integer not null default 0,
  runs       integer not null default 0,
  updated_at timestamptz not null default now()
);
create index if not exists leaderboard_rank_idx on public.leaderboard (best_level desc, best_score desc, updated_at asc);

-- 2) Sicherheit: alle dürfen lesen, schreiben nur über die Funktion unten.
alter table public.leaderboard enable row level security;
drop policy if exists "leaderboard lesen" on public.leaderboard;
create policy "leaderboard lesen" on public.leaderboard for select using (true);

-- 3) Ergebnis melden: legt neue Spieler an, aktualisiert den Namen und übernimmt den Lauf nur,
--    wenn er besser ist (höheres Level, oder gleiches Level mit mehr Punkten).
create or replace function public.submit_score(p_id uuid, p_name text, p_score integer, p_level integer, p_coins integer)
returns void language plpgsql security definer set search_path = public as $$
declare lvl smallint := greatest(1, least(10, p_level));
begin
  if p_score < 0 or p_score > 500000 then raise exception 'invalid score'; end if;
  insert into public.leaderboard as l (player_id, name, best_score, best_level, coins, runs, updated_at)
  values (p_id, left(trim(p_name), 20), p_score, lvl, p_coins, 1, now())
  on conflict (player_id) do update set
    name = left(trim(excluded.name), 20),
    runs = l.runs + 1,
    best_score = case when (excluded.best_level, excluded.best_score) > (l.best_level, l.best_score) then excluded.best_score else l.best_score end,
    best_level = case when (excluded.best_level, excluded.best_score) > (l.best_level, l.best_score) then excluded.best_level else l.best_level end,
    coins      = case when (excluded.best_level, excluded.best_score) > (l.best_level, l.best_score) then excluded.coins else l.coins end,
    updated_at = case when (excluded.best_level, excluded.best_score) > (l.best_level, l.best_score) then now() else l.updated_at end;
end $$;
grant execute on function public.submit_score(uuid, text, integer, integer, integer) to anon;

-- 4) Spielername ändern (ohne neues Ergebnis).
create or replace function public.rename_player(p_id uuid, p_name text)
returns void language sql security definer set search_path = public as $$
  update public.leaderboard set name = left(trim(p_name), 20) where player_id = p_id;
$$;
grant execute on function public.rename_player(uuid, text) to anon;

-- =====================================================================================
-- GEWINNSPIEL: E-Mail-Adressen der Teilnehmenden
-- Die E-Mail liegt in einer eigenen, gesperrten Tabelle. Das Spiel kann sie nur über
-- save_contact SPEICHERN, aber niemals lesen. Lesen kann nur, wer als Admin eingeloggt ist
-- (Supabase-Benutzer, dessen E-Mail in der Tabelle «admins» steht) – über admin_entries.
-- Dieser Teil kann gefahrlos auch nachträglich nochmals ausgeführt werden.
-- =====================================================================================

-- 5) Kontaktdaten (nicht öffentlich: RLS an, KEINE Regel für anon/authenticated)
create table if not exists public.player_contacts (
  player_id  uuid primary key,
  email      text not null check (char_length(email) between 5 and 254 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  consent_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.player_contacts enable row level security;
revoke all on public.player_contacts from anon, authenticated;

-- 6) Liste der Admins (nur deren E-Mail; das Passwort verwaltet Supabase Auth)
create table if not exists public.admins (email text primary key);
alter table public.admins enable row level security;
revoke all on public.admins from anon, authenticated;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));
$$;
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- 7) Name + E-Mail speichern (aus dem Spiel). Nur mit Einwilligung (p_consent = true).
--    Leere E-Mail = Teilnahme zurückziehen (Adresse wird gelöscht).
create or replace function public.save_contact(p_id uuid, p_name text, p_email text, p_consent boolean)
returns void language plpgsql security definer set search_path = public as $$
declare mail text := lower(trim(coalesce(p_email, '')));
begin
  if char_length(trim(coalesce(p_name, ''))) between 1 and 20 then
    update public.leaderboard set name = left(trim(p_name), 20) where player_id = p_id;
  end if;
  if mail = '' then
    delete from public.player_contacts where player_id = p_id;
    return;
  end if;
  if not coalesce(p_consent, false) then raise exception 'consent required'; end if;
  if mail !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' or char_length(mail) > 254 then raise exception 'invalid email'; end if;
  insert into public.player_contacts as c (player_id, email, consent_at, updated_at)
  values (p_id, mail, now(), now())
  on conflict (player_id) do update set email = excluded.email, updated_at = now();
end $$;
revoke execute on function public.save_contact(uuid, text, text, boolean) from public;
grant execute on function public.save_contact(uuid, text, text, boolean) to anon, authenticated;

-- 8) Teilnehmerliste für die Admin-Seite (nur eingeloggte Admins; alle anderen erhalten einen Fehler).
--    «rank» ist der Platz in der öffentlichen Rangliste (Level, Punkte, wer früher dort war).
create or replace function public.admin_entries()
returns table (rank bigint, name text, email text, best_level smallint, best_score integer, coins integer, runs integer, last_record timestamptz, joined timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'not allowed' using errcode = '42501'; end if;
  return query
    select l.rk, l.name, c.email, l.best_level, l.best_score, l.coins, l.runs, l.updated_at, c.consent_at
    from (select x.*, row_number() over (order by x.best_level desc, x.best_score desc, x.updated_at asc) as rk
          from public.leaderboard x) l
    join public.player_contacts c on c.player_id = l.player_id
    order by l.rk;
end $$;
revoke execute on function public.admin_entries() from public, anon;
grant execute on function public.admin_entries() to authenticated;

-- 9) ADMIN FESTLEGEN (einmalig, E-Mail anpassen):
--    a) Supabase → Authentication → Users → «Add user» → E-Mail + Passwort, «Auto Confirm User» anhaken
--    b) Danach hier die gleiche E-Mail eintragen und nur diese Zeile ausführen:
-- insert into public.admins (email) values ('admin@firma.ch') on conflict do nothing;
