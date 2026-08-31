# Deckers 룰 요약 (앱 로직에 필요한 부분)

출처: 공식 룰북 Deckers Rules EU v1.0 (Deep Print Games, 2025). 앱 구현에 필요한 흐름·판정만 발췌.

## 개요

- **인원:** 1–4인 (솔로/협력). 함께 이기고 함께 짐.
- **플레이 타임:** 60–90분.
- **테마:** 디스토피아, 인류에 등돌린 초거대 컴퓨터(SMC)를 해커(Decker)들이 해킹.
- **목표:** 5개 서버 네트워크를 해킹. 매 사이클 목표를 달성하며 최종 목표를 깨면 승리.

## 구성물 (카드 관련)

- 174장 커맨드 카드 계열 + 목표 카드 40장 + Mother's Ghost 4 + SMC/Decker/서버 등.
- 각 Decker 덱 = **기본 커맨드 카드 15장** (사이클당 3턴 = 15÷5).
- 목표 카드 40 = Copper 12 / Silver 12 / Gold 12 / Mother's Ghost 4.

## 게임 흐름 (Sequence of Play)

게임은 정해진 수의 **사이클(cycle)**로 진행. 사이클 수는 SMC마다 다름(보통 3~5).
각 사이클은 다음 페이즈로 구성:

1. **Intel Phase** — 이번 사이클 목표 카드 확인(색 = 보안 레벨). Goal/Setup/Rules 적용.
2. **Command Phase** — Decker당 3턴:
   - a. Start of Turn → b. Spawn(새 Spark) → c. Actions(커맨드 카드 플레이) → d. End of Turn → e. Draw 5 → f. Restock
3. **SMC Phase** — 모든 Decker 3턴 종료 후:
   - a. SMC Attack → b. **Resolve Objective**(성공/실패 판정, 카드 뒤집기) → c. Move Sparks
4. **Refresh Phase** — 다음 사이클 준비, 목표 카드 교체.

## 목표 덱 구성 (Setup)

- Copper/Silver/Gold를 색깔별로 나눠, SMC 카드의 "Cycles & Setup"에 지정된 수만큼 뽑음.
- 배치 순서: **Gold(맨 아래) → Silver(중간) → Copper(맨 위)**. → 진행하며 Copper부터 소모, 마지막이 Gold.
- Alpha-Moby 외 SMC는 같은 색 카드를 여러 장 가질 수 있음(사이클 3 초과).
- First game 추천: 404 Not Found(Copper) / Neural Matrix(Silver) / HackMan(Gold), SMC = Alpha-Moby.

## 승리/패배 판정 ★앱 핵심

- **승리 조건: 최종 Gold 목표 카드의 Goal 달성.**
  - Copper/Silver 목표는 **선택** — 실패해도 됨 (단, SMC가 강제하면 예외. 예: Sentinel은 전부 달성 필수).
- 각 사이클 Resolve Objective에서 성공/실패에 따라 카드를 뒤집어 SUCCESS/FAIL 효과 적용.
- 최종 Gold 카드의 뒷면(SUCCESS)에 도달하면 승리.

### 앱의 결과 판정 매핑 (자동 계산)

| 판정 | 조건 |
|---|---|
| **fail (실패)** | 최종 Gold 목표 실패 |
| **success (성공)** | 최종 Gold 성공 + 중간(Copper/Silver) 일부 실패 |
| **perfect (대성공)** | 모든 사이클 목표 전부 성공 |

→ 사이클별 성공/실패(`run_objectives`)를 입력하면 outcome이 자동 계산됨.
로직: `최종 Gold 실패 → fail` / `전부 성공 → perfect` / `그 외 → success`.

## 84칸 매핑 (앱 설계)

- **클리어 단위 = (SMC, 최종 Gold 카드).**
  - 승리(outcome ≠ fail)한 판의 최종 Gold 카드 → 그 (보스, Gold) 셀 클리어.
  - 그 셀에서 perfect 판이 하나라도 있으면 🥇 대성공 표기.
- **조합(Copper+Silver+Gold) = 셀 내부 도전 히스토리**로만 기록. 완주 대상 아님.

## 말/피스 개념 (참고)

- **Spark:** SMC가 스폰하는 원형 말(주로 검정, 고급 SMC는 흰색 = 더 위험). 한 칸 3개 → **Guardian**(사각)으로 변환.
- **Program / Installation:** Decker가 업로드하는 말.
- **Guardian:** 폭발(Explosion) 유발, 위험.
- 서버 = 5색(purple/red/blue/green/yellow), 각 6칸(entry = 6번 칸).

> 상세 전투/Infect/Explosion 규칙은 앱 기록에는 불필요(사용자가 실물로 판정) — 앱은 결과만 기록.
