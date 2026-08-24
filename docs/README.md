# Deckers 도장깨기 헬퍼 — 프로젝트 문서

Deckers(Deep Print Games, 2025) 보드게임용 **개인 컴패니언 앱**. 보스별·미션별 클리어를 도장깨기처럼 체크·기록하고, 목표 카드를 셔플/공개하는 헬퍼.

> 성격: 어디까지나 **개인 만족용 헬퍼 + 미션 깨기**. 상업 배포 아님.

## 문서 목록

| 문서 | 내용 |
|---|---|
| [ui-draft.md](./ui-draft.md) | UI 초안 — 화면 6종 목업 구성, 정보구조, 미결정 항목 |
| [cards.md](./cards.md) | SMC 7종 · Decker 10종 · 목표 카드 40장 전체 목록 + 확보한 카드 전문 |
| [rules-summary.md](./rules-summary.md) | 룰북 PDF에서 파악한 게임 흐름·승리조건·판정 규칙 |
| [data-model.md](./data-model.md) | 데이터 모델 설계 (Supabase + 로컬) |
| [supabase-setup.md](./supabase-setup.md) | Supabase 연동(Google 로그인·동기화) 설정 가이드 |
| [../db/schema.sql](../db/schema.sql) | 바로 실행 가능한 Supabase 스키마 SQL |

## 핵심 설계 결정 (확정)

1. **완주 기준 = Gold 미션 × SMC = 84칸**
   - 게임 승리 조건이 "최종 Gold 목표 성공"이라, Gold×보스가 미션 클리어의 자연 단위.
2. **조합(Copper+Silver+Gold) = 완주 대상이 아니라 셀 안의 기록**
   - 조합 공간은 1만 개 이상으로 폭발 → 채우는 게 아니라 셔플 재료 + 도전 히스토리로 활용.
3. **셀 클릭 → 그 Gold×보스의 도전 히스토리** (각 조합·덱커·플레이어·결과)
4. **덱커·플레이어 = 각 런 기록** (조종한 사람을 덱커별로 기록). 완주 축 아님, 원하면 업적으로.
5. **결과 판정 (자동 계산)**
   - 최종 Gold 실패 → **실패(fail)**
   - 최종 Gold 성공 + 일부 실패 → **성공(success)**
   - 모든 사이클 성공 → **대성공(perfect)**
6. **셔플 = 아직 못 깬 Gold×보스 우선** + Copper/Silver 자동 조합.

## 기술 스택

- **Frontend:** React + Vite, **PWA**(오프라인 지원)
- **로컬 저장:** Dexie(IndexedDB) — 비로그인 게스트 모드
- **백엔드:** Supabase (Postgres + Auth + RLS)
- **인증:** Google OAuth (Supabase Auth)
- **동기화:** 오프라인 퍼스트 → 로그인 시 로컬 데이터 병합/업로드

## 참고 아티팩트 (세션 산출물)

- UI 목업 v2 (Gold×SMC): 브라우저 아티팩트로 published
- SMC/목표카드 자료집: 브라우저 아티팩트로 published

## 데이터 확보 현황

- ✅ SMC 7종 (이름·티어·특수규칙)
- ✅ Decker 10종 (이름, 일부 색/능력)
- ✅ 목표 카드 40장 **이름 + 보안레벨 + 룰북 보충설명**
- ✅ 카드 **전문 6장** (룰북 예시): 404 Not Found, Neural Matrix, HackMan, Access Shutdown, Blackout, Shattered Glass
- ⏳ 나머지 34장 전문 → 실물 카드 보고 직접 입력 예정 (웹에 공개 자료 없음)
