# 데이터 모델 설계

Supabase(Postgres) 기준. 로컬(Dexie/IndexedDB)이 같은 구조를 미러링해 오프라인 퍼스트로 동작.
실행 가능한 전체 DDL은 [../db/schema.sql](../db/schema.sql).

## 설계 원칙

1. **DB는 유저 기록만 담는다.** SMC·덱커·목표 카드 같은 레퍼런스 데이터는 번들이
   단일 원본이다 — 언어 무관 뼈대는 [`src/data/gameData.js`](../src/data/gameData.js),
   판본별 이름·본문은 `src/data/content/{ko,en,de}.json`([../docs/i18n.md](i18n.md)).
   게스트 모드와 오프라인에서도 카드가 보여야 해서 번들에 반드시 있어야 하고,
   DB에 또 두면 영구 이중 관리가 된다.
   **다국어를 넣어도 이 테이블들은 바뀌지 않는다** — 저장하는 값이 전부 언어 무관 id다.
2. **런 1건 = 행 1개.** 덱커/목표를 JSONB로 안고 있어 upsert가 원자적이다.
   자식 테이블을 따로 두면 "부모만 저장되고 자식이 유실"되는 부분 실패가 생긴다.
3. **삭제는 tombstone.** 물리 삭제로는 "지웠다"는 사실을 다른 기기에 전달할 방법이 없다.
4. **`updated_at`은 서버가 찍는다.** 클라이언트 시계를 믿지 않고, 이 값이 증분 pull의 커서가 된다.

## 테이블

### runs — 유일한 테이블 (RLS: `user_id = auth.uid()`)

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `id` | uuid PK | 클라이언트 생성. Dexie와 공유 |
| `user_id` | uuid | `auth.users` 참조, on delete cascade |
| `smc_id` | text | 상대한 보스 |
| `played_at` | timestamptz | 실제 플레이 시각 (클라이언트) |
| `outcome` | run_outcome | 앱이 계산해 저장 |
| `note` | text | 자유 메모 |
| `deckers` | jsonb | `[{ deckerId, playerName }]` |
| `objectives` | jsonb | `[{ cycleNo, objectiveId, security, result, isFinal }]` |
| `deleted_at` | timestamptz | tombstone (null = 살아있음) |
| `created_at` / `updated_at` | timestamptz | `updated_at`은 트리거가 갱신 |

`security` = copper \| silver \| gold \| ghost, `result` = success \| fail.
두 JSONB 배열의 id는 `gameData.js`의 id와 대응한다. 참조 테이블이 없으므로 FK 무결성 대신
앱이 검증한다 — id 목록이 번들 상수라 실질 위험은 낮다.

**ENUM:** `run_outcome` = fail | success | perfect

**인덱스**
- `(user_id, updated_at)` — 증분 pull
- `(user_id, played_at desc) where deleted_at is null` — 보드/히스토리 조회

### reports — 앱 안에서 개발자에게 보내는 제보 (RLS: insert 공개 / select 본인)

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `id` | uuid PK | 클라이언트 생성 (오프라인 큐 재전송용) |
| `user_id` | uuid | 게스트 제보는 `null` |
| `kind` | text | `bug`(직접 작성) \| `crash`(에러 바운더리 자동 수집) |
| `message` | text | 1~2000자 |
| `context` | jsonb | 앱이 자동 수집 (아래) |
| `created_at` / `resolved_at` | timestamptz | 처리하면 `resolved_at` 기록 |

`context`에 담기는 것: `appVersion, route, account, locale, online, standalone,
syncStatus, syncMessage, runCount, screen, language, userAgent, at`.
(`locale` = 앱에 설정된 언어, `language` = 기기 언어)
`kind='crash'`면 `errorName, stack, componentStack`이 추가된다(각 4000자로 자름).

제보자가 상황을 설명하지 않아도 어디서 난 오류인지 알 수 있게 하는 게 목적이고,
폼에서 **"함께 보내는 정보"를 펼쳐 그대로 확인**할 수 있다.

### 크래시 수집

[`ErrorBoundary`](../src/components/ErrorBoundary.jsx)가 렌더 예외를 잡아 흰 화면 대신
복구 화면(다시 시도 / 보드로 / 이 오류 보내기)을 띄운다. `main.jsx`에서 **SyncProvider
바깥**에 두므로 Provider 자체가 터져도 잡힌다. 훅을 쓸 수 없는 위치라 전송은
`flushReports()`로 직접 하고, 실패해도 큐에 남아 다음 실행에 나간다.

게스트 모드가 정식 사용 경로라 `anon`에게 insert를 열어야 한다. URL을 아는 누구나
행을 넣을 수 있다는 뜻이므로, 스팸이 문제가 되면 정책을 `authenticated` 전용으로 좁힌다.
조회는 본인 것만 가능하다.

## 판정 로직

`objectives` 로부터 outcome 계산 ([`src/lib/outcome.js`](../src/lib/outcome.js)):
- 최종(`isFinal`) Gold `result = fail` → **fail**
- 모든 result = success → **perfect**
- 그 외 → **success**

## 클리어 규칙

- 셀 = (smc_id, 최종 gold objectiveId). 7 × 12 = **84칸**.
- 클리어: 그 조합으로 `outcome != fail` 런 ≥ 1 → ✓
- 🥇: 그 셀에서 `outcome = perfect` 런 ≥ 1

보드·통계·업적·미클리어 조합은 전부 `runs`에서 파생 계산한다
([`src/lib/derive.js`](../src/lib/derive.js), 업적은
[`src/lib/achievements.js`](../src/lib/achievements.js)). 따로 저장하지 않으므로 원본과
어긋날 일이 없고, `runs`만 동기화되면 모든 기기에서 같은 화면이 나온다.

**파생 계산은 `db/`가 아니라 `lib/`에 둔다.** 런 배열만 받는 순수 함수라 Dexie도
React도 필요 없다 — 같이 두면 파생 계산 하나를 쓰려고 IndexedDB 전체를 끌고
들어와야 하고, 테스트가 먼저 그 벽에 부딪힌다. `db/runs.js`에는 읽기·쓰기와 훅만 남는다.

## 로컬(Dexie) 스토어

```
runs     'id, smcId, playedAt, outcome, dirty'
meta     'key'        // 유저별 pull 커서, 업적 해금 표시 등
reports  'id, dirty, createdAt'
```

`meta`에 들어가는 키:

| 키 | 값 |
|---|---|
| `lastPulledAt:{userId}` | 증분 pull 커서 |
| `seenAchievements:{userId}` | 이미 토스트로 보여준 업적 id 목록 ([achievements.md](achievements.md)) |
| `purgedRunCount` | 물리 삭제한 런의 누적 횟수. tombstone이 남지 않는 삭제를 세기 위한 값 |

셋 다 기기 로컬이고 동기화되지 않는다 — 서버에 올릴 값이 아니라 이 기기의 표시 상태다.

서버 필드와 1:1 + 로컬 전용 3개:

| 필드 | 의미 |
|---|---|
| `dirty` | 1 = 아직 못 올린 로컬 변경. push 성공 시에만 0 |
| `deletedAt` | 삭제 tombstone. 화면에서 숨기되 행은 남긴다 |
| `updatedAt` | 서버가 찍어준 값. null = 한 번도 올라간 적 없음 |

`deletedAt`은 색인하지 않는다 — IndexedDB는 `null`을 키로 색인하지 못해
"살아있는 런"을 인덱스로 거를 수 없다. 메모리에서 거른다.

## 동기화 (오프라인 퍼스트)

모든 쓰기는 **로컬 먼저**, 즉시 UI 반영. 게스트는 로컬에만 저장한다.

로그인 세션이 확인되면 [`SyncProvider`](../src/lib/SyncProvider.jsx)가 **앱 루트에서**
자동으로 1회 동기화한다. 어느 탭에 있든 돌기 때문에, 다른 기기에서 앱을 열자마자
보드가 채워진다.

**push** — `dirty=1`인 런을 한 번의 upsert로 전송. 서버가 확인해준 행만 `dirty=0`으로
바꾸고 서버의 `updated_at`을 저장한다. 실패분은 `dirty`가 남아 다음 회차에 재시도된다.

**pull** — `updated_at > 커서`인 행만 받아 로컬에 반영. 커서는 유저별로 분리 저장해
같은 기기에서 계정을 바꿔도 남의 커서를 물려받지 않는다.

**충돌** — 로컬에 아직 못 올린 변경(`dirty`)이 있으면 그 행은 pull에서 건너뛴다.
다음 push에서 서버가 갱신되므로 결국 양쪽이 수렴한다.

**삭제** — `deleted_at`을 찍고 `dirty=1`로 표시해 push. 로컬에도 tombstone이 남아
다음 pull이 되살리지 않는다. 한 번도 올라간 적 없는 런(`updatedAt === null`)은
서버에 지울 것이 없으므로 tombstone 없이 바로 제거한다.

**제보** — 같은 `dirty` 큐를 타지만 **로그인과 무관하게** 전송된다. 게스트가 만난
오류야말로 개발자에게 닿아야 하기 때문이다. 그래서 `syncAll`은 비로그인 상태에서도
제보만 밀어내고, 보낼 제보가 없으면 아예 돌지 않아 배너를 띄우지 않는다.
재전송 시 PK 중복(`23505`)은 "이미 들어갔는데 응답만 유실된 경우"로 보고 전송 완료 처리한다.

## 남겨둔 것

- **업적 해금 시각.** 업적은 `runs`에서 파생되므로 기기 간에는 이미 일치한다
  ([achievements.md](achievements.md)). "언제 땄는지"를 남기려면 `user_achievements`
  테이블과 해금 전이 감지가 필요하다. 해금 연출은 그 대신 로컬 `meta`의
  `seenAchievements`(본 업적 id 목록)로 처리한다 — 기기마다 따로 뜬다.
- **계정 전환.** 같은 기기에서 계정을 바꿔 로그인하면 이전 로컬 기록이 새 계정으로 병합된다.
  개인용 전제라 그대로 뒀다.
