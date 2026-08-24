# 데이터 모델 설계

Supabase(Postgres) 기준. 로컬(Dexie/IndexedDB)은 같은 구조를 미러링해 오프라인 퍼스트로 동작.
실행 가능한 전체 DDL은 [../db/schema.sql](../db/schema.sql).

## 테이블 개요

### 참조 테이블 (공용 읽기, RLS: authenticated select)
- **smcs** — 보스 7종. `id, name, difficulty, tier, cycles, special_rule`
- **deckers** — 캐릭터 10종. `id, name, color, is_primary, ability`
- **objective_cards** — 목표 카드 40장. `id, name, security, goal, setup, rules, success, fail, flavor_*` (내용은 추후 입력)

### 유저 데이터 (본인 것만, RLS: user_id = auth.uid())
- **runs** — 한 판. `id, user_id, smc_id, played_at, outcome(fail/success/perfect), note`
- **run_deckers** — 덱커별 조종자. `run_id, decker_id, player_name`
- **run_objectives** — 사이클별 결과. `run_id, cycle_no, objective_id, security, result(success/fail), is_final`

### 업적
- **achievements** — 정의. `id, name, description, metric, threshold, icon`
- **user_achievements** — 획득. `user_id, achievement_id, unlocked_at`

## ENUM

- `security_level`: copper | silver | gold | ghost
- `run_outcome`: fail | success | perfect
- `objective_result`: success | fail

## 핵심 뷰

### v_gold_smc_clears — 도장 보드(84칸)의 원천
최종 Gold를 성공(승리)한 판 기준으로 (SMC, Gold) 셀 클리어.
```sql
select user_id, smc_id, gold_id, count(*) attempts_won,
       bool_or(perfect) has_perfect, max(played_at) last_at
```
- 셀 상태: 존재 = ✓, has_perfect = 🥇.

### v_gold_mission_attempts — 셀 클릭 상세(도전 히스토리)
특정 (SMC, 최종 Gold)에 도전한 모든 런(실패 포함) + 각 런의 조합(Copper/Silver/Gold)·덱커·결과.

### v_user_stats — 업적/프로필 통계
`total_runs, total_wins, total_perfects, total_stamps(=클리어 셀 수)`.

## 판정 로직 (앱 + DB 검증)

`run_objectives` 로부터 outcome 계산:
- 최종(is_final) Gold `result = fail` → **fail**
- 모든 result = success → **perfect**
- 그 외 → **success**

DB 함수 `calc_run_outcome(run_id)` 로 검증 가능. 앱은 저장 시 이 값을 `runs.outcome`에 기록.

## 도장 규칙

- 셀 = (smc_id, 최종 gold objective_id).
- 클리어: 그 조합으로 `outcome != fail` 런 ≥ 1.
- 🥇: 그 셀에서 `outcome = perfect` 런 ≥ 1.

## 로컬 ↔ 클라우드 동기화 (오프라인 퍼스트)

1. 모든 쓰기는 **로컬(Dexie) 먼저**. 즉시 UI 반영.
2. 비로그인(게스트): 로컬에만 저장.
3. 로그인 시:
   - 로컬의 미동기화 런을 서버로 업로드(merge).
   - 서버 데이터를 로컬로 pull.
   - **중복 처리 정책 확정 필요**(Q6): 로컬 우선 / 서버 우선 / 합치기.
4. 각 레코드에 `client_id`(로컬 생성 UUID) + `updated_at` 두어 idempotent upsert 권장.

## 로컬(Dexie) 스토어(안)

```
runs, run_deckers, run_objectives  (서버와 동일 필드 + client_id, synced flag)
ref_smcs, ref_deckers, ref_cards    (참조 캐시)
meta (마지막 sync 시각 등)
```
