-- =====================================================================
--  DECKERS 도장깨기 헬퍼 — Supabase(Postgres) 스키마  (v3: 동기화 전용)
--  Stack: React + Vite (PWA) · Supabase · Dexie(local) · Google OAuth
--
--  설계 원칙
--   1) 이 DB는 "유저 기록"만 담는다. 레퍼런스 데이터(SMC·덱커·목표 카드)는
--      src/data/gameData.js 가 단일 원본 — 게스트 모드와 오프라인에서도
--      카드가 보여야 하므로 번들에 반드시 있어야 하고, DB에 또 두면 영구
--      이중 관리가 된다.
--   2) 런 1건 = 행 1개. 덱커/목표를 JSONB로 안고 있어 upsert가 원자적이다.
--      (부모만 저장되고 자식이 유실되는 부분 실패가 구조적으로 불가능)
--   3) 삭제는 물리 삭제가 아니라 deleted_at tombstone. 그래야 "지웠다"는
--      사실이 다른 기기로 전파되고, 다음 pull에서 되살아나지 않는다.
--   4) updated_at 은 서버가 찍는다. 클라이언트 시계를 믿지 않고, 이 값이
--      증분 동기화(pull) 커서가 된다.
--
--  완주 기준 = (SMC, 최종 Gold 카드) = 7 × 12 = 84칸.
--  판정: 최종 Gold 실패 → fail / 전부 성공 → perfect / 그 외 → success
--  (Sentinel은 모든 목표의 실패가 fail.)
-- =====================================================================

create type run_outcome as enum ('fail', 'success', 'perfect');

-- =====================================================================
--  runs — 유일한 유저 데이터 테이블
-- =====================================================================
--  deckers    : [{ deckerId, playerName }]
--  objectives : [{ cycleNo, objectiveId, security, result, isFinal }]
--  smc_upgrade: 0(기본) | 1(+Gold 1장) | 2(+Gold 2장)
--    security = 'copper' | 'silver' | 'gold' | 'ghost'
--    result   = 'success' | 'fail'
--    isFinal  = 최종 Gold 여부 (도장 보드의 축)
--  두 배열의 id 값은 gameData.js 의 id 와 대응한다. 참조 테이블이 없으므로
--  FK 무결성 대신 앱이 검증한다 — id 목록이 번들 상수라 실질 위험은 낮다.
create table runs (
  id         uuid        primary key,          -- 클라이언트 생성. Dexie와 공유하는 PK
  user_id    uuid        not null references auth.users(id) on delete cascade,
  smc_id     text        not null,
  smc_upgrade smallint   not null default 0 check (smc_upgrade between 0 and 2),
  played_at  timestamptz not null,             -- 실제로 플레이한 시각 (클라이언트)
  outcome    run_outcome not null,             -- objectives 에서 앱이 계산
  note       text        not null default '',
  deckers    jsonb       not null default '[]'::jsonb,
  objectives jsonb       not null default '[]'::jsonb,
  deleted_at timestamptz,                      -- tombstone (null = 살아있음)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),  -- 동기화 커서 (서버 시계)

  constraint deckers_is_array    check (jsonb_typeof(deckers) = 'array'),
  constraint objectives_is_array check (jsonb_typeof(objectives) = 'array')
);

-- 증분 pull: where user_id = :me and updated_at > :cursor order by updated_at
create index idx_runs_pull on runs (user_id, updated_at);

-- 히스토리/보드 조회: 살아있는 런만 최신순
create index idx_runs_live on runs (user_id, played_at desc) where deleted_at is null;

-- =====================================================================
--  updated_at 자동 갱신 — 클라이언트가 보낸 값은 무시하고 서버가 덮어쓴다
-- =====================================================================
create or replace function touch_updated_at()
returns trigger
set search_path = ''
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger runs_touch_updated_at
  before update on runs
  for each row execute function touch_updated_at();

-- =====================================================================
--  RLS — 본인 기록만
-- =====================================================================
alter table runs enable row level security;

create policy "own runs" on runs
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- =====================================================================
--  reports — 앱 안에서 개발자에게 보내는 오류/제안 제보
-- =====================================================================
--  kind:
--    'bug'   — 사용자가 프로필 제보란에 직접 쓴 오류
--    'crash' — 에러 바운더리가 잡은 렌더 예외. context에 stack/componentStack이 붙는다
--
--  context 예시:
--    { appVersion, route, online, standalone, account, syncStatus,
--      syncMessage, runCount, userAgent, screen, language, at,
--      errorName, stack, componentStack }
--  제보자가 직접 쓰지 않아도 되도록 앱이 자동으로 붙인다.
create table reports (
  id          uuid        primary key,          -- 클라이언트 생성 (오프라인 큐 재전송용)
  user_id     uuid        references auth.users(id) on delete set null,  -- 게스트는 null
  kind        text        not null default 'bug',
  message     text        not null,
  context     jsonb       not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  resolved_at timestamptz,                      -- 개발자가 처리하면 기록

  constraint kind_known   check (kind in ('bug', 'crash')),
  constraint message_size check (char_length(message) between 1 and 2000)
);

-- 아직 처리 안 한 제보를 최신순으로
create index idx_reports_open on reports (created_at desc) where resolved_at is null;
create index idx_reports_user on reports (user_id);

alter table reports enable row level security;

-- 게스트 모드가 정식 사용 경로이므로 anon도 제보할 수 있어야 한다.
-- 대신 조회는 막혀 있어 남의 제보를 읽을 수는 없다.
--   ⚠ URL을 아는 누구나 행을 넣을 수 있다는 뜻이기도 하다. 스팸이 문제가 되면
--     Supabase 대시보드에서 이 정책을 authenticated 전용으로 좁히면 된다.
create policy "anyone can report" on reports
  for insert to anon, authenticated
  with check (true);

-- 본인이 보낸 제보만 조회 가능
create policy "own reports" on reports
  for select to authenticated
  using (user_id = (select auth.uid()));

-- =====================================================================
--  제보 메일 알림 — 새 reports 행이 들어오면 Resend 로 메일을 보낸다
-- =====================================================================
--  대시보드를 들여다봐야만 제보를 알 수 있던 문제를 없앤다.
--
--  키와 받을 주소는 Vault 에 둔다. 함수 정의에는 이름만 남으므로 이 파일을
--  스키마 덤프로 갱신해도 비밀이 따라오지 않는다 — 이 레포는 퍼블릭이다.
--  아래 두 줄은 프로젝트마다 값이 다르므로 직접 실행한다(커밋하지 않는다).
--
--    select vault.create_secret('re_...',            'resend_api_key',  'Resend API 키');
--    select vault.create_secret('you@example.com',   'report_email_to', '제보 받을 주소');
--
--  키 교체는 함수를 건드릴 필요 없이 Vault 값만 갈아끼우면 된다:
--    select vault.update_secret(
--      (select id from vault.secrets where name = 'resend_api_key'), '새키');

create extension if not exists pg_net;

create or replace function notify_report_by_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  api_key text;
  mail_to text;
begin
  select decrypted_secret into api_key
    from vault.decrypted_secrets where name = 'resend_api_key';
  select decrypted_secret into mail_to
    from vault.decrypted_secrets where name = 'report_email_to';

  -- 설정이 없으면 조용히 통과한다. 알림 때문에 제보 저장 자체가 실패하면 본말전도다.
  if api_key is null or mail_to is null then
    return new;
  end if;

  -- pg_net 은 비동기다. 메일 API 가 느리거나 죽어도 insert 를 붙잡지 않는다.
  -- 발송 결과는 net._http_response 에 남는다.
  perform net.http_post(
    url := 'https://api.resend.com/emails',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || api_key,
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'from', 'Deckers <onboarding@resend.dev>',
      'to', jsonb_build_array(mail_to),
      'subject', format('[Deckers] %s — %s', new.kind,
                        replace(left(new.message, 40), E'\n', ' ')),
      'text', concat_ws(E'\n',
        new.message,
        '',
        '--------------------',
        '종류   : ' || new.kind,
        '버전   : ' || coalesce(new.context->>'appVersion', '—'),
        '화면   : ' || coalesce(new.context->>'route', '—'),
        '계정   : ' || coalesce(new.context->>'account', '—'),
        '언어   : ' || coalesce(new.context->>'locale', '—'),
        '설치   : ' || case when (new.context->>'standalone') = 'true'
                            then 'PWA' else '브라우저' end,
        '기록수 : ' || coalesce(new.context->>'runCount', '—'),
        '기기   : ' || coalesce(new.context->>'userAgent', '—'),
        '시각   : ' || new.created_at::text,
        case when new.context ? 'stack'
             then E'\nstack:\n' || (new.context->>'stack') end
      )
    )
  );
  return new;
end $$;

-- 버그까지 다 오는 게 시끄러우면 when (new.kind = 'crash') 를 붙여 좁힌다.
drop trigger if exists reports_email_notify on reports;
create trigger reports_email_notify
  after insert on reports
  for each row execute function notify_report_by_email();
