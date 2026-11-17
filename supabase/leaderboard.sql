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
