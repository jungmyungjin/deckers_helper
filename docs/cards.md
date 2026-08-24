# Deckers 카드 & 구성물 데이터

출처: 공식 룰북(Deckers Rules EU, v1.0, Deep Print Games) + BGG #443306.
카드 속 말(Spark/Program 색상 등) 아이콘은 텍스트로 옮기며 `[말]`처럼 일반화함.

---

## 1. SMC (보스) 7종

| id | 이름 | 난이도(추정) | 티어 | 특수 규칙 요약 |
|---|---|---|---|---|
| alpha-moby | Alpha-Moby | ★☆☆☆ | 입문 | 첫 사이클엔 Spawn 없음. 매 턴 시작 시 Active Decker 칸에 Spark 1 |
| spider | Spider | ★★☆☆ | 중급 | Spawn 때 Spark를 퍼뜨려 말을 포위. 가장자리 open 칸이 취약 |
| glom | Glom | ★★☆☆ | 중급 | 셋업 Program 일괄 배치. 새 Spark는 최저번호·최소수 칸에. End of Turn에 뭉침 |
| logi | Logi | ★★☆☆ | 중급 | Spawn 시 주사위 없음(고유 규칙). 검은 Spark 생성 |
| viking | Viking | ★★★☆ | 중급 | Spawn 중 Guardian 잘 생성. Spawn 중 폭발은 홀수 칸으로만 |
| sentinel | Sentinel | ★★★★ | 최상급 | 모든 목표 GOAL 달성 필수(아니면 패배). Infect 절차 대체 |
| mother | Mother | ★★★★ | 최상급 | 시작부터 Spark 다수. 매 턴 entry에 Spark 1. 변형 시 Ghost와 대결 |

> 난이도(별 개수)는 룰북 설명 기반 **추정**. 정확한 별 수는 실물 SMC 카드 상단에 인쇄 → 보정 필요.

---

## 2. Decker (캐릭터) 10종

| id | 이름 | 색 | 능력 요약 |
|---|---|---|---|
| oshin-noro | Oshin Noro | red | 자기 칸의 모든 Infect 절차에 특수 적용 |
| monty-quantum | Monty Quantum | green | Ghosting 스페셜리스트 |
| tilda-sweet | Tilda Sweet | yellow | 더 적은 command로 업로드 가능(Modify 유리) |
| hettie-magnetic | Hettie Magnetic | blue | 이동 시 말 1개 추가 운반 |
| angel-nitrate | Angel Nitrate | purple | 자기 칸에 들어올 Spark를 인접 칸으로 리다이렉트 |
| leiko-mori | Leiko Mori | purple | 시작 타입을 셋업 중 선택. 목표 카드가 참조 가능 |
| rupert-stanz | Rupert Stanz | purple | 유일하게 특수 말을 supply에서 투입 가능 |
| tokyo-black | Tokyo Black | ? | 현재 있는 서버 타일을 재배치 |
| kelly-nexus | Kelly Nexus | ? | 첫 두 턴에 카드 2장 추가 보유 |
| techno-twins | The Techno Twins | ? | 아바타 2개가 같은 entry, 독립 행동 |

> 색상 5종(red/green/yellow/blue/purple) × 2명(Primary/Alternate) = 10명 구조.
> First game 추천 Primary(퍼플 제외): Oshin(red), Monty(green), Tilda(yellow), Hettie(blue).
> Tokyo Black / Kelly Nexus / Techno Twins의 색·Primary여부는 실물로 확인 필요.

---

## 3. 목표 카드 40장 (전체 목록)

구성: **Copper 12 + Silver 12 + Gold 12 + Mother's Ghost 4 = 40장**
아래 "보충설명"은 룰북 부록 *Clarifications on Objective Cards*의 요약. **각 카드의 Goal/Success/Fail 전문은 실물 카드에만 인쇄** (아래 §4의 6장 제외).

### 🟫 Copper (보안 Lv.1, 12장)

| 카드 | 보충설명(요약) |
|---|---|
| 404 Not Found | Command phase 중 SMC의 Spark 배치·Explosion으로 놓이는 Spark에 영향 |
| Access Denied | 인원수에 따른 칸들에 최소 특정 말 필요 |
| Alert to our Presence | (보충설명 없음) |
| Clockwork Plague | 실패 시 FAIL 효과는 조건 맞는 home server에만 |
| Double-Switch | "정확히 Spark 2개" = 딱 2개, 색 무관 |
| Garbage Detail | 여러 Decker가 같은 closed 칸에 있어도 첫 목표 달성 |
| Hot-Wire | (보충설명 없음) |
| Keycode | (보충설명 없음) |
| Knowledge is the Price of Freedom | 참가 Decker 색에 따라 각 색 말 필요. 실패해도 일부 있으면 완화 |
| Misdirection | (보충설명 없음) |
| Roman Candle | (보충설명 없음) |
| Shattered Glass | 카드에 올릴 말은 supply에서(비면 network) |

### 🩶 Silver (보안 Lv.2, 12장)

| 카드 | 보충설명(요약) |
|---|---|
| Access Shutdown | Spark는 항상 하나씩 순서대로 배치 |
| Data Overload | 다른 서버 2곳에 Pathway → 다른 서버 Pathway로 연결 |
| Dreams in Vermilion | Spawn 중 current/rolled server가 red server로 대체 |
| Fireworks | (보충설명 없음) |
| Hacker's Palace | Palace 건설용 Installation은 규칙상 Installation 아님. 즉시 발동 조건 |
| Jacob's Ladder | home 2·3칸 조건 초과/불일치 시 미달성. 이동 순서 선택 |
| Neural Matrix | 색 혼합 상관없이 달성(전부 같은 색일 필요 없음) |
| Null & Void | Transformation/Explosion으로 제거된 Spark도 포함 |
| Reduct or Reboot | 칸 번호 합이 인원수별 값과 정확히 일치. Sentinel전 실패해도 패배X, 반복 |
| Scrambler | 색만 맞으면 다른 서버 5번 칸도 유효 |
| Swarm | 특수 Spawn은 Dreams in Vermilion 참조 |
| Viral Overload | (보충설명 없음) |

### 🟡 Gold (보안 Lv.3 · 최종, 12장) — **도장 기준 축**

| 코드 | 카드 | 보충설명(요약) |
|---|---|---|
| BLK | Blackout | Move 외 효과로는 avatar가 1·3·5칸 진입 가능 |
| DDF | Distributed Defense | 여러 Decker가 같은 칸 공유해 달성 가능 |
| DNI | DNI Web | Move 외 효과로는 현재 서버 떠날 수 있음 |
| FLD | Flash Flood | 카드로 말 옮기는 Move는 ghost도 가능 |
| HAK | HackMan | HackMan은 Guardian처럼 작동, 진입 시 다른 말 제거+재배치 |
| INS | Insert Misinformation | 등거리 1번칸 여럿이면 선택. Trojan Horse 말은 규칙상 제외 |
| MSG | Message Queue | 선택 말은 shift 대신 카드에 올림. 시퀀스 마지막은 아무 색 Spark |
| MIR | Mirror Map | 모든 home server + 1서버 동일하게 채워야 |
| NEU | Neutrino-Scanner | 1·2·3칸에서 각 1개 이동(없으면 skip) |
| ROM | Roman Road | 하나의 Pathway가 여러 Decker에 동시 카운트 |
| SIM | SimSmudge | SMC Attack을 매 End of Turn마다 추가 수행 |
| WTR | Waterfall | 지정 말 없는 최저 칸 찾고 높은 칸 말을 순서대로 하강 |

### 🟣 Mother's Ghost (Gold 2.X, "Upgraded SMC" 변형 전용, 4장)

| 카드 | 보충설명(요약) |
|---|---|
| Shellshock | Mother's Ghost를 같은 색 Program으로 둘러싸야 액션 수행 |
| Tempest | Infect 실패 시 Health가 시작 Health 초과 가능 |
| Titanium | 지정 말마다 +1에 더해 +4 추가 부여 |
| Tsunami | Mother's Ghost가 지정 말처럼 작동, 셋업 시 자기 칸 말 제거 |

---

## 4. 확보한 카드 전문 6장 (룰북 예시 기준)

> 신뢰도 높음. 아이콘은 `[말]`로 일반화. 나머지 34장은 실물 입력 예정.

### 404 Not Found — Copper
- **GOAL:** 각 Decker home server 4번 칸에 모든 `[Spark]`·`[Guardian]`이 없어야 함.
- **RULES:** Command Phase 중 `[Spark]`가 6번 칸에 들어오려 하면 대신 같은 서버 4번 칸에 배치.
- **FAIL:** *"She made a simultaneous unlock of the new RME (Riddle, Mystery, Enigma) code nigh impossible."* → 모든 서버(home 외 포함) 1번 칸마다 `[Spark]` 1개.

### Neural Matrix — Silver
- **GOAL:** X개 서버의 각 홀수 칸에 최소 1개의 `[X]`/`[Y]`. (X = Decker 수 + 1)
- **RULES:** 특수 규칙 없음.

### HackMan — Gold
- **GOALS:** ① HackMan 제거(`[Guardian]` 제거하듯) ② 모든 avatar가 각자 entry space에.
- **SETUP:** supply(비면 network)에서 `[X]` 1개를 `[Y]` 위에 쌓음 = "HackMan", 옆에 둠.
- **RULES:** HackMan과 모든 `[말]`은 `[Guardian]`처럼 작동. 매 Start of Turn마다 HackMan이 Active Decker 칸으로 이동.

### Access Shutdown — Silver
- **SUCCESS:** *"If she shuts the front door, we'll just come in the back."* → 모든 서버 4번 칸마다 `[X]` 1개.
- **FAIL:** *"Too late team, she's seen us and is shutting this one down."* → 4·5번 칸에 `[X]`/`[Y]` 있는 각 서버 6번 칸에 `[X]` 1개.

### Blackout — Gold
- **GOAL:** 각 Decker home server 1·3·5번 칸에 최소 1개의 `[X]`/`[Y]`. 모든 avatar가 entry space에.
- **SETUP:** 각 Decker home server 1·3·5번 칸에서 모든 `[Spark]` 제거.
- **RULES:** Command Phase 중 avatar는 Move로 어떤 서버든 1·3·5번 칸 진입 불가(ghost는 가능).
- **SUCCESS:** *"That blackout was tough to navigate, but now we've got the lights on full beam, let's go!"* → 각 Decker entry space에 `[X]` 1개.
- **FAIL:** *"The blackout is lifting, but the only thing we're seeing clearly is more trouble..."*

### Shattered Glass — Copper
- **GOAL:** 이 카드 위에 최소 X개의 `[말]`.
- **SETUP:** 각 Decker는 자기 entry space의 `[X]` 1개를 `[Y]` 1개로 교체 가능.
- **RULES:** Modify 액션 시 supply에서 `[X]` 1개를 카드 위에 올림.

---

## 5. 데이터 확보 참고

- 나머지 34장의 **전문(Goal/Success/Fail)**은 웹 어디에도 텍스트로 공개돼 있지 않음
  (공식 사이트, BGG 파일/이미지-Cloudflare 차단, TTS, GitHub, 리뷰 전부 확인).
- 실물 카드 촬영 후 입력하거나, 사진을 주면 트랜스크립트로 변환하는 방식으로 채울 예정.
