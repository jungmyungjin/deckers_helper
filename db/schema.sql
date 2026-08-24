-- =====================================================================
--  DECKERS 도장깨기 헬퍼 — Supabase(Postgres) 스키마  (v2: Gold × SMC)
--  Stack: React + Vite (PWA) · Supabase · Dexie(local) · Google OAuth
--
--  완주 기준 = (SMC, 최종 Gold 카드) = 84칸.
--  조합(Copper+Silver+Gold) = 셀 내부 도전 히스토리로만 기록.
--
--  판정: 최종 Gold 실패→fail / 전부 성공→perfect / 그 외→success
-- =====================================================================

-- ---------- 1) ENUMs ----------
create type security_level   as enum ('copper', 'silver', 'gold', 'ghost');
create type run_outcome      as enum ('fail', 'success', 'perfect');
create type objective_result as enum ('success', 'fail');

-- =====================================================================
--  2) 참조 테이블 (모든 로그인 유저 읽기 전용)
-- =====================================================================
create table smcs (
  id           text primary key,        -- 'alpha-moby'
  name         text not null,
  difficulty   smallint,                -- 별 개수(1~4). 실물로 보정
  tier         text,                    -- '입문'/'중급'/'최상급'
  cycles       smallint,
  special_rule text,
  sort_order   smallint default 0
);

create table deckers (
  id          text primary key,         -- 'oshin-noro'
  name        text not null,
  color       text,                     -- red/green/yellow/blue/purple (미확인 null)
  is_primary  boolean,
  ability     text,
  sort_order  smallint default 0
);

create table objective_cards (
  id             text primary key,      -- 'gold-hackman'
  name           text not null,
  security       security_level not null,
  goal           text,
  setup          text,
  rules          text,
  success        text,
  fail           text,
  flavor_success text,
  flavor_fail    text,
  sort_order     smallint default 0
);

-- =====================================================================
--  3) 유저 데이터 (본인 것만)
-- =====================================================================
create table runs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  smc_id      text not null references smcs(id),
  played_at   timestamptz not null default now(),
  outcome     run_outcome not null,     -- 앱에서 계산해 저장
  note        text,
  client_id   uuid,                     -- 로컬 생성 id (오프라인 동기화용)
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table run_deckers (
  id          uuid primary key default gen_random_uuid(),
  run_id      uuid not null references runs(id) on delete cascade,
  decker_id   text not null references deckers(id),
  player_name text,                     -- 그 덱커를 조종한 사람
  unique (run_id, decker_id)
);

create table run_objectives (
  id           uuid primary key default gen_random_uuid(),
  run_id       uuid not null references runs(id) on delete cascade,
  cycle_no     smallint not null,
  objective_id text references objective_cards(id),
  security     security_level not null,
  result       objective_result not null,
  is_final     boolean not null default false,  -- 최종 Gold 여부
  unique (run_id, cycle_no)
);

-- =====================================================================
--  4) 업적
-- =====================================================================
create table achievements (
  id          text primary key,
  name        text not null,
  description text,
  metric      text not null,            -- 'stamps' | 'perfects' | 'runs' | 'combos'
  threshold   int  not null,
  icon        text,
  sort_order  smallint default 0
);

create table user_achievements (
  user_id        uuid not null references auth.users(id) on delete cascade,
  achievement_id text not null references achievements(id),
  unlocked_at    timestamptz not null default now(),
  primary key (user_id, achievement_id)
);

-- =====================================================================
--  5) 인덱스
-- =====================================================================
create index idx_runs_user       on runs(user_id, played_at desc);
create index idx_runs_smc        on runs(user_id, smc_id);
create index idx_run_deckers_run on run_deckers(run_id);
create index idx_run_deckers_dk  on run_deckers(decker_id);
create index idx_run_obj_run     on run_objectives(run_id);
create index idx_run_obj_final   on run_objectives(run_id) where is_final;

-- =====================================================================
--  6) 뷰
-- =====================================================================

-- (6-1) 도장 보드: (SMC × 최종 Gold) 클리어  = 84칸의 원천
create or replace view v_gold_smc_clears as
select
  r.user_id,
  r.smc_id,
  o.objective_id                  as gold_id,
  count(*)                        as attempts_won,
  bool_or(r.outcome = 'perfect')  as has_perfect,
  max(r.played_at)                as last_cleared_at
from runs r
join run_objectives o
  on o.run_id = r.id and o.is_final and o.security = 'gold'
where r.outcome in ('success', 'perfect')
group by r.user_id, r.smc_id, o.objective_id;

-- (6-2) 셀 클릭 상세: 특정 (SMC, 최종 Gold)에 도전한 모든 런(실패 포함)
--   각 런의 조합/덱커는 run_objectives / run_deckers 조인으로 상세 조회
create or replace view v_gold_mission_attempts as
select
  r.id            as run_id,
  r.user_id,
  r.smc_id,
  gf.objective_id as gold_id,        -- 최종 Gold
  r.outcome,
  r.played_at,
  r.note
from runs r
join run_objectives gf
  on gf.run_id = r.id and gf.is_final and gf.security = 'gold';
-- 사용 예: where user_id=:me and smc_id=:boss and gold_id=:gold order by played_at desc

-- (6-3) 프로필/업적 통계
create or replace view v_user_stats as
select
  r.user_id,
  count(*)                                      as total_runs,
  count(*) filter (where r.outcome <> 'fail')   as total_wins,
  count(*) filter (where r.outcome = 'perfect') as total_perfects,
  (select count(*) from v_gold_smc_clears c
     where c.user_id = r.user_id)               as total_stamps  -- /84
from runs r
group by r.user_id;

-- =====================================================================
--  7) RLS
-- =====================================================================
alter table smcs            enable row level security;
alter table deckers         enable row level security;
alter table objective_cards enable row level security;
alter table achievements    enable row level security;

create policy "ref read smcs"    on smcs            for select to authenticated using (true);
create policy "ref read deckers" on deckers         for select to authenticated using (true);
create policy "ref read cards"   on objective_cards for select to authenticated using (true);
create policy "ref read ach"     on achievements    for select to authenticated using (true);

alter table runs              enable row level security;
alter table run_deckers       enable row level security;
alter table run_objectives    enable row level security;
alter table user_achievements enable row level security;

create policy "own runs" on runs
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own run_deckers" on run_deckers
  for all to authenticated
  using     (exists (select 1 from runs r where r.id = run_id and r.user_id = auth.uid()))
  with check (exists (select 1 from runs r where r.id = run_id and r.user_id = auth.uid()));

create policy "own run_objectives" on run_objectives
  for all to authenticated
  using     (exists (select 1 from runs r where r.id = run_id and r.user_id = auth.uid()))
  with check (exists (select 1 from runs r where r.id = run_id and r.user_id = auth.uid()));

create policy "own user_achievements" on user_achievements
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- =====================================================================
--  8) outcome 검증 함수
-- =====================================================================
create or replace function calc_run_outcome(p_run_id uuid)
returns run_outcome language sql stable as $$
  select case
    when bool_or(is_final and security='gold' and result='fail') then 'fail'::run_outcome
    when bool_and(result = 'success')                            then 'perfect'::run_outcome
    else 'success'::run_outcome
  end
  from run_objectives where run_id = p_run_id;
$$;

-- =====================================================================
--  9) 시드 데이터
-- =====================================================================

-- SMC 7 (difficulty 는 추정 — 실물 별 개수로 보정)
insert into smcs (id, name, difficulty, tier, cycles, special_rule, sort_order) values
  ('alpha-moby','Alpha-Moby',1,'입문',3,'첫 사이클 Spawn 없음. 매 턴 Active Decker 칸에 Spark 1',1),
  ('spider','Spider',2,'중급',null,'Spawn 때 Spark 확산으로 포위',2),
  ('glom','Glom',2,'중급',null,'셋업 Program 일괄 배치. End of Turn에 Spark 뭉침',3),
  ('logi','Logi',2,'중급',null,'Spawn 시 주사위 없음. 검은 Spark',4),
  ('viking','Viking',3,'중급',null,'Spawn 중 Guardian 생성 촉진. 홀수 칸 폭발',5),
  ('sentinel','Sentinel',4,'최상급',null,'모든 목표 달성 필수. Infect 대체',6),
  ('mother','Mother',4,'최상급',null,'시작부터 Spark 다수. 매 턴 entry Spark 1',7);

-- Decker 10 (color/is_primary 확실한 것만)
insert into deckers (id, name, color, is_primary, ability, sort_order) values
  ('oshin-noro','Oshin Noro','red',true,'자기 칸 Infect 특수',1),
  ('monty-quantum','Monty Quantum','green',true,'Ghosting 스페셜리스트',2),
  ('tilda-sweet','Tilda Sweet','yellow',true,'더 적은 command로 업로드',3),
  ('hettie-magnetic','Hettie Magnetic','blue',true,'이동 시 말 1 추가 운반',4),
  ('angel-nitrate','Angel Nitrate','purple',null,'Spark를 인접 칸으로 리다이렉트',5),
  ('leiko-mori','Leiko Mori','purple',null,'시작 타입을 셋업 중 선택',6),
  ('rupert-stanz','Rupert Stanz','purple',null,'특수 말을 supply에서 투입',7),
  ('tokyo-black','Tokyo Black',null,null,'현재 서버 타일 재배치',8),
  ('kelly-nexus','Kelly Nexus',null,null,'첫 두 턴 카드 2장 추가 보유',9),
  ('techno-twins','The Techno Twins',null,null,'아바타 2개 독립 행동',10);

-- 목표 카드 40장 — 이름/보안레벨만 시드 (내용은 추후 UPDATE)
insert into objective_cards (id, name, security, sort_order) values
  -- Copper 12
  ('copper-404-not-found','404 Not Found','copper',1),
  ('copper-access-denied','Access Denied','copper',2),
  ('copper-alert-to-our-presence','Alert to our Presence','copper',3),
  ('copper-clockwork-plague','Clockwork Plague','copper',4),
  ('copper-double-switch','Double-Switch','copper',5),
  ('copper-garbage-detail','Garbage Detail','copper',6),
  ('copper-hot-wire','Hot-Wire','copper',7),
  ('copper-keycode','Keycode','copper',8),
  ('copper-knowledge-price-freedom','Knowledge is the Price of Freedom','copper',9),
  ('copper-misdirection','Misdirection','copper',10),
  ('copper-roman-candle','Roman Candle','copper',11),
  ('copper-shattered-glass','Shattered Glass','copper',12),
  -- Silver 12
  ('silver-access-shutdown','Access Shutdown','silver',1),
  ('silver-data-overload','Data Overload','silver',2),
  ('silver-dreams-in-vermilion','Dreams in Vermilion','silver',3),
  ('silver-fireworks','Fireworks','silver',4),
  ('silver-hackers-palace','Hacker''s Palace','silver',5),
  ('silver-jacobs-ladder','Jacob''s Ladder','silver',6),
  ('silver-neural-matrix','Neural Matrix','silver',7),
  ('silver-null-and-void','Null & Void','silver',8),
  ('silver-reduct-or-reboot','Reduct or Reboot','silver',9),
  ('silver-scrambler','Scrambler','silver',10),
  ('silver-swarm','Swarm','silver',11),
  ('silver-viral-overload','Viral Overload','silver',12),
  -- Gold 12 (도장 축)
  ('gold-blackout','Blackout','gold',1),
  ('gold-distributed-defense','Distributed Defense','gold',2),
  ('gold-dni-web','DNI Web','gold',3),
  ('gold-flash-flood','Flash Flood','gold',4),
  ('gold-hackman','HackMan','gold',5),
  ('gold-insert-misinformation','Insert Misinformation','gold',6),
  ('gold-message-queue','Message Queue','gold',7),
  ('gold-mirror-map','Mirror Map','gold',8),
  ('gold-neutrino-scanner','Neutrino-Scanner','gold',9),
  ('gold-roman-road','Roman Road','gold',10),
  ('gold-simsmudge','SimSmudge','gold',11),
  ('gold-waterfall','Waterfall','gold',12),
  -- Mother's Ghost (Gold 2.X) 4
  ('ghost-shellshock','Shellshock','ghost',1),
  ('ghost-tempest','Tempest','ghost',2),
  ('ghost-titanium','Titanium','ghost',3),
  ('ghost-tsunami','Tsunami','ghost',4);

-- 확보한 전문 6장 UPDATE (아이콘은 [말]로 일반화)
update objective_cards set
  goal='각 Decker home server 4번 칸에 모든 [Spark]·[Guardian]이 없어야 함',
  rules='Command Phase 중 [Spark]가 6번 칸에 들어오려 하면 대신 같은 서버 4번 칸에 배치',
  fail='모든 서버(home 외 포함) 1번 칸마다 [Spark] 1개',
  flavor_fail='She made a simultaneous unlock of the new RME code nigh impossible.'
where id='copper-404-not-found';

update objective_cards set
  goal='X개 서버의 각 홀수 칸에 최소 1개의 [X]/[Y] (X = Decker 수 + 1)',
  rules='특수 규칙 없음'
where id='silver-neural-matrix';

update objective_cards set
  goal='① HackMan 제거([Guardian] 제거하듯) ② 모든 avatar가 각자 entry space에',
  setup='supply(비면 network)에서 [X] 1개를 [Y] 위에 쌓음 = "HackMan", 옆에 둠',
  rules='HackMan과 모든 [말]은 [Guardian]처럼 작동. 매 Start of Turn마다 HackMan이 Active Decker 칸으로 이동'
where id='gold-hackman';

update objective_cards set
  success='모든 서버 4번 칸마다 [X] 1개',
  flavor_success='If she shuts the front door, we''ll just come in the back.',
  fail='4·5번 칸에 [X]/[Y] 있는 각 서버 6번 칸에 [X] 1개',
  flavor_fail='Too late team, she''s seen us and is shutting this one down.'
where id='silver-access-shutdown';

update objective_cards set
  goal='각 Decker home server 1·3·5번 칸에 최소 1개의 [X]/[Y]. 모든 avatar가 entry space에',
  setup='각 Decker home server 1·3·5번 칸에서 모든 [Spark] 제거',
  rules='Command Phase 중 avatar는 Move로 어떤 서버든 1·3·5번 칸 진입 불가(ghost는 가능)',
  success='각 Decker entry space에 [X] 1개',
  flavor_success='That blackout was tough to navigate, but now we''ve got the lights on full beam.',
  flavor_fail='The blackout is lifting, but the only thing we''re seeing clearly is more trouble...'
where id='gold-blackout';

update objective_cards set
  goal='이 카드 위에 최소 X개의 [말]',
  setup='각 Decker는 자기 entry space의 [X] 1개를 [Y] 1개로 교체 가능',
  rules='Modify 액션 시 supply에서 [X] 1개를 카드 위에 올림'
where id='copper-shattered-glass';

-- 업적 예시
insert into achievements (id, name, description, metric, threshold, icon, sort_order) values
  ('stamps-1','첫 침투','첫 도장','stamps',1,'🩹',1),
  ('stamps-5','숙련 데커','도장 5','stamps',5,'💾',2),
  ('stamps-25','베테랑','도장 25','stamps',25,'🧬',3),
  ('stamps-84','풀 클리어','도장 84 완주','stamps',84,'👑',4),
  ('perfects-1','완벽한 해킹','첫 대성공','perfects',1,'🌟',5),
  ('perfects-10','퍼펙트 해커','대성공 10','perfects',10,'💎',6),
  ('combos-30','조합 수집가','서로 다른 조합 30','combos',30,'🎴',7);
