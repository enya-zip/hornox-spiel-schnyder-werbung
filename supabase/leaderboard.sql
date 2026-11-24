-- =====================================================================================
-- HORNOX RUN · Globale Rangliste und Gewinnspiel (Supabase / PostgreSQL)
--
-- Projekt: «Ranglisten der Spiele» (gemeinsam mit Schnyder-Game und Iischi Party).
-- Alle Tabellen und Funktionen von HORNOX beginnen mit hornox_ – so sieht man im
-- Table Editor sofort, was zu welchem Spiel gehört.
--
-- Einmal im Supabase-Projekt ausführen: Dashboard → SQL Editor → New query → einfügen → Run.
-- Die Datei kann gefahrlos mehrmals ausgeführt werden (auch über eine ältere Version).
--
-- Ablauf im Spiel: Game Over → «Weiter zur Rangliste» → Name + E-Mail → hornox_save_run →
-- Rangliste (hornox_leaderboard_top / hornox_player_standing).
--
-- Datenschutz:
--  * Die Rangliste zeigt nur Name, Punkte, Level und Platz.
--  * E-Mail-Adressen liegen in einer gesperrten Tabelle. Das Spiel kann sie nur speichern,
--    nie lesen. Lesen kann nur der Admin mit dem Admin-Passwort (hornox_admin_entries / hornox_admin_runs).
--  * Alle Tabellen sind für die Öffentlichkeit gesperrt; gelesen wird nur über die Funktionen.
-- =====================================================================================

-- 0) Tabellen mit verständlichen Namen (Umbenennung der früheren Namen, Daten bleiben erhalten):
--    hornox_bestwerte       bestes Ergebnis pro Spieler (daraus entsteht die Rangliste im Spiel)
--    hornox_emails          E-Mail-Adresse pro Spieler (gesperrt)
--    hornox_alle_spiele     jedes einzelne Spiel mit Datum und Uhrzeit
--    hornox_admin_passwort  verschlüsseltes Passwort für die Admin-Seite
--    hornox_rangliste       Übersicht für das Dashboard: Platz, Name, E-Mail, Punkte
do $$
begin
  if to_regclass('public.hornox_leaderboard') is not null and to_regclass('public.hornox_bestwerte') is null then
    alter table public.hornox_leaderboard rename to hornox_bestwerte;
  end if;
  if to_regclass('public.hornox_player_contacts') is not null and to_regclass('public.hornox_emails') is null then
    alter table public.hornox_player_contacts rename to hornox_emails;
  end if;
  if to_regclass('public.hornox_runs') is not null and to_regclass('public.hornox_alle_spiele') is null then
    alter table public.hornox_runs rename to hornox_alle_spiele;
  end if;
  if to_regclass('public.hornox_admin_secret') is not null and to_regclass('public.hornox_admin_passwort') is null then
    alter table public.hornox_admin_secret rename to hornox_admin_passwort;
  end if;
end $$;

-- 1) Bester Lauf pro Spieler (öffentlich sichtbar über leaderboard_top, ohne E-Mail)
create table if not exists public.hornox_bestwerte (
  player_id  uuid primary key,
  name       text not null check (char_length(name) between 1 and 20),
  best_score integer not null default 0 check (best_score >= 0 and best_score <= 500000),
  best_level smallint not null default 1 check (best_level between 1 and 10),
  coins      integer not null default 0,
  runs       integer not null default 0,
  updated_at timestamptz not null default now()
);
-- Rangfolge: Punkte (höher zuerst), bei Gleichstand wer die Punktzahl früher erreicht hat.
drop index if exists public.hornox_leaderboard_rank_idx;
create index if not exists hornox_leaderboard_score_idx on public.hornox_bestwerte (best_score desc, updated_at asc);
alter table public.hornox_bestwerte enable row level security;
drop policy if exists "hornox_leaderboard lesen" on public.hornox_bestwerte;
revoke all on public.hornox_bestwerte from anon, authenticated;

-- 2) Jeder gespeicherte Lauf mit Datum und Uhrzeit (nicht öffentlich)
create table if not exists public.hornox_alle_spiele (
  id         bigserial primary key,
  run_id     uuid not null unique,          -- vom Spiel erzeugt: verhindert doppelte Einträge bei Mehrfachklick
  player_id  uuid not null,
  name       text not null,
  score      integer not null check (score >= 0 and score <= 500000),
  level      smallint not null check (level between 1 and 10),
  coins      integer not null default 0,
  played_at  timestamptz not null default now()
);
create index if not exists hornox_runs_player_idx on public.hornox_alle_spiele (player_id, played_at desc);
alter table public.hornox_alle_spiele enable row level security;
revoke all on public.hornox_alle_spiele from anon, authenticated;

-- 3) E-Mail-Adressen (gesperrt: nur speichern über save_run, lesen nur für Admins)
create table if not exists public.hornox_emails (
  player_id  uuid primary key,
  email      text not null check (char_length(email) between 5 and 254 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  consent_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.hornox_emails enable row level security;
revoke all on public.hornox_emails from anon, authenticated;

-- 4) Frühere, unbenutzte Admin-Tabelle (Login über Supabase Auth) entfernen.
--    Der Adminbereich nutzt das Passwort in hornox_admin_passwort (Abschnitt 9).
drop function if exists public.hornox_is_admin();
drop table if exists public.hornox_admins;

-- 5) Rang eines Spielers (Platz, Gesamtzahl, eigene Werte)
create or replace function public.hornox_player_standing(p_id uuid)
returns table (rank bigint, total bigint, name text, best_score integer, best_level smallint, updated_at timestamptz)
language sql stable security definer set search_path = public as $$
  select (select count(*) from public.hornox_bestwerte o
           where o.best_score > l.best_score or (o.best_score = l.best_score and o.updated_at < l.updated_at)) + 1,
         (select count(*) from public.hornox_bestwerte),
         l.name, l.best_score, l.best_level, l.updated_at
  from public.hornox_bestwerte l where l.player_id = p_id;
$$;

-- 6) Lauf speichern: Name + E-Mail (Pflicht) + Punkte + Level. Speichert den Lauf mit Datum/Uhrzeit,
--    aktualisiert den besten Lauf des Spielers und gibt den neuen Platz zurück.
--    * Derselbe run_id wird nur einmal gespeichert (doppelte Klicks / Netzwerk-Wiederholungen).
--    * Eine E-Mail-Adresse = ein Spieler: spielt jemand auf mehreren Geräten, werden die Läufe
--      zusammengeführt (keine doppelten Einträge in der Rangliste). player_id im Ergebnis ist die
--      Spieler-ID, unter der die Läufe gespeichert sind; das Spiel übernimmt sie.
drop function if exists public.hornox_save_run(uuid, uuid, text, text, integer, integer, integer);
create or replace function public.hornox_save_run(p_id uuid, p_run uuid, p_name text, p_email text, p_score integer, p_level integer, p_coins integer default 0)
returns table (player_id uuid, rank bigint, total bigint, name text, best_score integer, best_level smallint, updated_at timestamptz)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare
  nm   text := left(trim(coalesce(p_name, '')), 20);
  mail text := lower(trim(coalesce(p_email, '')));
  lvl  smallint := greatest(1, least(10, coalesce(p_level, 1)));
  pid  uuid;
  inserted integer;
begin
  if char_length(nm) < 1 then raise exception 'name required' using errcode = '22023'; end if;
  if char_length(mail) > 254 or mail !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'invalid email' using errcode = '22023'; end if;
  if p_score is null or p_score < 0 or p_score > 500000 then raise exception 'invalid score' using errcode = '22023'; end if;
  if p_id is null or p_run is null then raise exception 'missing id' using errcode = '22023'; end if;

  -- Gibt es diese E-Mail schon, gehört der Lauf zu diesem Spieler.
  select c.player_id into pid from public.hornox_emails c where c.email = mail order by c.updated_at limit 1;
  if pid is null then pid := p_id; end if;

  insert into public.hornox_alle_spiele (run_id, player_id, name, score, level, coins)
  values (p_run, pid, nm, p_score, lvl, greatest(0, coalesce(p_coins, 0)))
  on conflict (run_id) do nothing;
  get diagnostics inserted = row_count;

  if inserted > 0 then
    insert into public.hornox_bestwerte as l (player_id, name, best_score, best_level, coins, runs, updated_at)
    values (pid, nm, p_score, lvl, greatest(0, coalesce(p_coins, 0)), 1, now())
    on conflict (player_id) do update set
      name       = excluded.name,
      runs       = l.runs + 1,
      best_level = case when excluded.best_score > l.best_score then excluded.best_level else l.best_level end,
      coins      = case when excluded.best_score > l.best_score then excluded.coins else l.coins end,
      updated_at = case when excluded.best_score > l.best_score then now() else l.updated_at end,
      best_score = greatest(l.best_score, excluded.best_score);
  else
    update public.hornox_bestwerte l set name = nm where l.player_id = pid;
  end if;

  insert into public.hornox_emails as c (player_id, email, consent_at, updated_at)
  values (pid, mail, now(), now())
  on conflict (player_id) do update set email = excluded.email, updated_at = now();

  return query select pid, s.* from public.hornox_player_standing(pid) s;
end $$;

-- 7) Rangliste lesen (öffentlich): Platz, Name, Punkte, Level. p_me markiert den eigenen Eintrag,
--    ohne dass Spieler-IDs öffentlich werden.
create or replace function public.hornox_leaderboard_top(p_limit integer default 50, p_offset integer default 0, p_me uuid default null)
returns table (rank bigint, name text, best_score integer, best_level smallint, updated_at timestamptz, is_me boolean)
language sql stable security definer set search_path = public as $$
  select row_number() over (order by l.best_score desc, l.updated_at asc),
         l.name, l.best_score, l.best_level, l.updated_at, l.player_id = p_me
  from public.hornox_bestwerte l
  order by l.best_score desc, l.updated_at asc
  limit greatest(1, least(200, coalesce(p_limit, 50))) offset greatest(0, coalesce(p_offset, 0));
$$;

-- 8) Namen ändern (nur mit der eigenen, geheimen Spieler-ID)
create or replace function public.hornox_rename_player(p_id uuid, p_name text)
returns void language sql security definer set search_path = public as $$
  update public.hornox_bestwerte set name = left(trim(p_name), 20) where player_id = p_id and char_length(trim(p_name)) between 1 and 20;
$$;

-- 9) Admin-Zugang mit Passwort. Das Passwort liegt nur als verschlüsselter Hash (bcrypt) in der
--    gesperrten Tabelle admin_secret und wird ausschliesslich in der Datenbank geprüft.
--    Passwort setzen/ändern: nur hier im SQL Editor (siehe Abschnitt 12) – nie aus dem Spiel.
create extension if not exists pgcrypto with schema extensions;
create table if not exists public.hornox_admin_passwort (
  id         integer primary key default 1 check (id = 1),
  pw_hash    text not null,
  updated_at timestamptz not null default now()
);
alter table public.hornox_admin_passwort enable row level security;
revoke all on public.hornox_admin_passwort from anon, authenticated;

create or replace function public.hornox_set_admin_password(p_password text)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  if char_length(coalesce(p_password, '')) < 8 then raise exception 'Das Passwort muss mindestens 8 Zeichen lang sein.'; end if;
  insert into public.hornox_admin_passwort (id, pw_hash, updated_at) values (1, extensions.crypt(p_password, extensions.gen_salt('bf', 10)), now())
  on conflict (id) do update set pw_hash = excluded.pw_hash, updated_at = now();
end $$;

-- Prüft das Admin-Passwort. Falsche Versuche werden absichtlich verzögert (erschwert Durchprobieren).
create or replace function public.hornox_admin_check(p_password text)
returns boolean language plpgsql security definer set search_path = public, extensions as $$
declare ok boolean;
begin
  select exists (select 1 from public.hornox_admin_passwort a where a.pw_hash = extensions.crypt(coalesce(p_password, ''), a.pw_hash)) into ok;
  if not ok then perform pg_sleep(1); end if;
  return ok;
end $$;

-- Admin: Rangliste mit E-Mail-Adressen (bester Lauf je Spieler) und alle einzelnen Läufe
drop function if exists public.hornox_admin_entries();
drop function if exists public.hornox_admin_runs();
create or replace function public.hornox_admin_entries(p_password text)
returns table (rank bigint, name text, email text, best_level smallint, best_score integer, coins integer, runs integer, last_record timestamptz, last_played timestamptz, joined timestamptz)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
begin
  if not public.hornox_admin_check(p_password) then raise exception 'not allowed' using errcode = '42501'; end if;
  return query
    select l.rk, l.name, c.email, l.best_level, l.best_score, l.coins, l.runs, l.updated_at,
           (select max(r.played_at) from public.hornox_alle_spiele r where r.player_id = l.player_id), c.consent_at
    from (select x.*, row_number() over (order by x.best_score desc, x.updated_at asc) as rk from public.hornox_bestwerte x) l
    left join public.hornox_emails c on c.player_id = l.player_id
    order by l.rk;
end $$;

create or replace function public.hornox_admin_runs(p_password text)
returns table (played_at timestamptz, name text, email text, score integer, level smallint, coins integer)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
begin
  if not public.hornox_admin_check(p_password) then raise exception 'not allowed' using errcode = '42501'; end if;
  return query
    select r.played_at, r.name, c.email, r.score, r.level, r.coins
    from public.hornox_alle_spiele r left join public.hornox_emails c on c.player_id = r.player_id
    order by r.played_at desc;
end $$;

-- 9b) Übersicht für das Supabase-Dashboard (Table Editor → «hornox_rangliste»): fertige Rangliste mit E-Mail.
--     Nur im Dashboard sichtbar – für das Spiel und die Öffentlichkeit gesperrt.
drop view if exists public.hornox_rangliste;
create view public.hornox_rangliste as
  select row_number() over (order by l.best_score desc, l.updated_at asc) as platz,
         l.name, c.email, l.best_score as punkte, l.best_level as level, l.runs as laeufe,
         l.updated_at as bestleistung_am,
         (select max(r.played_at) from public.hornox_alle_spiele r where r.player_id = l.player_id) as letztes_spiel
  from public.hornox_bestwerte l left join public.hornox_emails c on c.player_id = l.player_id
  order by platz;
revoke all on public.hornox_rangliste from anon, authenticated;

-- 10) Alte Funktionen der ersten Version entfernen (werden nicht mehr verwendet)
drop function if exists public.hornox_submit_score(uuid, text, integer, integer, integer);
drop function if exists public.hornox_save_contact(uuid, text, text, boolean);

-- 11) Rechte: Spieler dürfen speichern und die Rangliste lesen; Admin-Funktionen liefern nur mit richtigem Passwort Daten.
revoke execute on function public.hornox_player_standing(uuid) from public;
revoke execute on function public.hornox_save_run(uuid, uuid, text, text, integer, integer, integer) from public;
revoke execute on function public.hornox_leaderboard_top(integer, integer, uuid) from public;
revoke execute on function public.hornox_rename_player(uuid, text) from public;
revoke execute on function public.hornox_admin_entries(text) from public;
revoke execute on function public.hornox_admin_runs(text) from public;
revoke execute on function public.hornox_admin_check(text) from public;
revoke execute on function public.hornox_set_admin_password(text) from public, anon, authenticated;
grant execute on function public.hornox_player_standing(uuid) to anon, authenticated;
grant execute on function public.hornox_save_run(uuid, uuid, text, text, integer, integer, integer) to anon, authenticated;
grant execute on function public.hornox_leaderboard_top(integer, integer, uuid) to anon, authenticated;
grant execute on function public.hornox_rename_player(uuid, text) to anon, authenticated;
grant execute on function public.hornox_admin_entries(text) to anon, authenticated;
grant execute on function public.hornox_admin_runs(text) to anon, authenticated;
grant execute on function public.hornox_admin_check(text) to anon, authenticated;

-- 12) ADMIN-PASSWORT FESTLEGEN (einmalig, und jederzeit zum Ändern):
--    Passwort anpassen (mind. 8 Zeichen), nur diese Zeile markieren und ausführen:
-- select public.hornox_set_admin_password('MeinSicheresPasswort');
