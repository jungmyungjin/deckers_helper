# Supabase 연동 설정

앱은 **Supabase 없이도 게스트/로컬 모드**로 완전히 동작한다. 아래는 로그인·동기화를 켤 때만 필요.

## 1. Supabase 프로젝트 생성

1. https://supabase.com 에서 프로젝트 생성.
2. **SQL Editor**에서 [`db/schema.sql`](../db/schema.sql) 전체를 붙여넣고 실행 → `runs` 테이블·인덱스·트리거·RLS 생성.

DB에는 **유저 기록만** 들어간다. SMC·덱커·목표 카드는 [`src/data/gameData.js`](../src/data/gameData.js)가 단일 원본 — 게스트 모드와 오프라인에서도 카드가 보여야 하므로 번들에 있어야 하고, DB에 또 두면 이중 관리가 된다.

## 2. Google 로그인(OAuth) 설정

1. Supabase 대시보드 → **Authentication → Providers → Google** 활성화.
2. Google Cloud Console에서 OAuth 클라이언트 생성, 다음을 등록:
   - **Authorized redirect URI:** `https://<프로젝트>.supabase.co/auth/v1/callback`
3. 발급된 Client ID / Secret을 Supabase Google provider에 입력.
4. Supabase → **Authentication → URL Configuration**
   - **Site URL:** 배포 도메인 (예: `https://deckers-helper.vercel.app`)
   - **Redirect URLs:** `http://localhost:5173`, 배포 도메인.
     Vercel 프리뷰 배포는 URL이 매번 바뀌므로, 프리뷰에서도 로그인하려면
     `https://deckers-helper-*.vercel.app` 같은 와일드카드도 함께 등록.

> 이 등록을 빠뜨리면 배포 도메인에서 로그인 자체가 되지 않는다.
> 앱은 `redirectTo: window.location.origin`으로 돌아오므로 접속한 주소가 그대로 등록돼 있어야 한다.
> 실패해서 돌아오면 프로필 화면의 로그인 버튼 아래에 안내가 뜨고, 콘솔에 GoTrue가
> 보낸 `error` / `error_description`이 그대로 찍힌다.

### 왜 PKCE인가

[`src/lib/supabase.js`](../src/lib/supabase.js)는 `flowType: 'pkce'`로 클라이언트를 만든다.
supabase-js 기본값은 implicit이고, 그러면 토큰이 `#access_token=…` 프래그먼트로 돌아온다.
이 앱은 HashRouter라 프래그먼트가 곧 라우트여서 같은 자리를 두고 다투게 된다 —
로그인 직후 supabase가 해시를 비우면 히스토리에 빈 항목이 끼고, 액세스 토큰이
주소창과 방문 기록에 남는다. PKCE는 `?code=`(쿼리)로 돌아오므로 라우터와 겹치지 않고,
코드 교환이 끝나면 `history.replaceState`로 조용히 지워진다.

## 3. 앱 환경변수

프로젝트 루트에 `.env` 생성 ([.env.example](../.env.example) 참고):

```
VITE_SUPABASE_URL=https://<프로젝트>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon public key>
```

dev 서버 재시작하면 프로필 화면의 **Google 로그인** 버튼이 활성화된다.

## 4. 동작 방식

- **게스트:** 모든 기록이 이 기기(IndexedDB)에만 저장.
- **로그인:** 세션이 확인되면 **어느 화면에 있든** 자동 동기화 1회.
  프로필의 `🔄 동기화` 버튼으로 수동 실행, 온라인 복귀 시에도 자동 재시도.

### 동기화 규칙

| 항목 | 방식 |
|---|---|
| PK | `run.id` (클라이언트 생성 UUID)를 로컬·서버 공유 → upsert가 idempotent |
| 저장 단위 | 런 1건 = 행 1개. 덱커/목표는 JSONB → **부분 실패 불가능** |
| 업로드 | `dirty=1`인 런만. 서버가 확인해준 행만 `dirty=0`으로, 실패분은 다음 회차 재시도 |
| 다운로드 | `updated_at > 커서`인 행만 (증분). 커서는 유저별로 분리 저장 |
| 충돌 | 로컬에 아직 못 올린 변경(`dirty`)이 있으면 로컬 우선 → 다음 push에서 서버 갱신 |
| 삭제 | `deleted_at` tombstone. 물리 삭제가 아니라서 다른 기기로 전파되고 되살아나지 않음 |
| `updated_at` | **서버가 트리거로 기록.** 클라이언트 시계를 믿지 않음 |

한 번도 서버에 올라간 적 없는 런(`updatedAt === null`)을 지울 때는 tombstone 없이 로컬에서 바로 제거한다 — 서버에 지울 것이 없기 때문.

- 코드: [`src/lib/SyncProvider.jsx`](../src/lib/SyncProvider.jsx), [`src/lib/sync.js`](../src/lib/sync.js), [`src/db/localDb.js`](../src/db/localDb.js)

## 5. 제보 확인하기

프로필 하단 **오류 제보**로 들어온 내용과, 크래시 화면에서 보낸 자동 리포트가
`reports` 테이블에 쌓인다 (`kind` = `bug` / `crash`).

- **읽기:** Supabase 대시보드 → Table Editor → `reports`.
  `context` 열에 앱 버전·화면·계정·동기화 상태·브라우저가 들어 있어 재현에 필요한
  정보가 대부분 담긴다. 처리한 건은 `resolved_at`을 채워두면 미처리분만 추리기 쉽다.

```sql
-- 아직 처리 안 한 제보
select created_at, kind, message, context->>'appVersion' as ver, context->>'route' as route
from reports where resolved_at is null order by created_at desc;

-- 크래시만, 스택까지
select created_at, message, context->>'stack' as stack, context->>'componentStack' as component
from reports where kind = 'crash' order by created_at desc;
```

### 메일 알림

제보가 들어오면 **메일로 온다.** `reports` INSERT 트리거가 `pg_net`으로 Resend API를
호출한다 ([`db/schema.sql`](../db/schema.sql) 마지막 절). 앱 코드와 무관하게 DB 안에서만
도는 구조라, 배포본을 건드리지 않고 켜고 끌 수 있다.

새 프로젝트에 붙일 때 필요한 건 Vault 값 두 개뿐이다. **키가 스키마에 남지 않도록**
함수에는 이름만 두고 값은 Vault에 넣는다 — 이 레포는 퍼블릭이다.

```sql
select vault.create_secret('re_...',          'resend_api_key',  'Resend API 키');
select vault.create_secret('you@example.com', 'report_email_to', '제보 받을 주소');
```

- **도메인 인증 전에는** `onboarding@resend.dev`에서 발송되고 Resend 계정 이메일로만
  배달된다. 안 보이면 스팸함부터 확인.
- **발송 이력:** `select status_code, content, created from net._http_response
  order by created desc;` — 200이면 Resend가 접수한 것.
- **키 교체:** 함수는 그대로 두고 Vault 값만 바꾼다.
  `select vault.update_secret((select id from vault.secrets where name = 'resend_api_key'), '새키');`
- **크래시만 받으려면** 트리거에 `when (new.kind = 'crash')`를 붙인다.

알림이 실패해도 제보 저장은 성공한다 — Vault에 값이 없으면 함수가 조용히 통과한다.

메일 대신 Discord/Slack이면 대시보드 → Database → **Webhooks**에서 `reports` INSERT 훅을
만들어 웹훅 URL만 넣으면 된다. 이쪽은 Vault도 트리거도 필요 없다.

## 향후 개선 여지

- 업적 해금 시각(`unlocked_at`) 기록 — 현재 업적은 `runs`에서 파생 계산이라 기기 간에는 이미 일치하지만, "언제 땄는지"는 남지 않는다.
- 같은 기기에서 계정을 바꿔 로그인하면 이전 게스트/계정의 로컬 기록이 새 계정으로 병합된다. 개인용 전제라 그대로 뒀다.
