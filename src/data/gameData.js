// Deckers 참조 데이터 (룰북 기준). 카드 전문은 확보한 6장만 채워짐 — 나머지는 추후 입력.

export const SMCS = [
  { id: 'alpha-moby', name: 'Alpha-Moby', difficulty: 1, tier: '입문', cycles: 3, special: '첫 사이클 Spawn 없음. 매 턴 Active Decker 칸에 Spark 1' },
  { id: 'spider', name: 'Spider', difficulty: 2, tier: '중급', cycles: 4, special: 'Spawn 때 Spark 확산으로 포위' },
  { id: 'glom', name: 'Glom', difficulty: 2, tier: '중급', cycles: 4, special: '셋업 Program 일괄 배치. End of Turn에 Spark 뭉침' },
  { id: 'logi', name: 'Logi', difficulty: 2, tier: '중급', cycles: 4, special: 'Spawn 시 주사위 없음. 검은 Spark' },
  { id: 'viking', name: 'Viking', difficulty: 3, tier: '중급', cycles: 4, special: 'Spawn 중 Guardian 생성 촉진. 홀수 칸 폭발' },
  { id: 'sentinel', name: 'Sentinel', difficulty: 4, tier: '최상급', cycles: 5, special: '모든 목표 달성 필수. Infect 대체' },
  { id: 'mother', name: 'Mother', difficulty: 4, tier: '최상급', cycles: 5, special: '시작부터 Spark 다수. 매 턴 entry Spark 1' },
]

export const DECKERS = [
  { id: 'oshin-noro', name: 'Oshin Noro', color: 'red', ability: '자기 칸 Infect 특수' },
  { id: 'monty-quantum', name: 'Monty Quantum', color: 'green', ability: 'Ghosting 스페셜리스트' },
  { id: 'tilda-sweet', name: 'Tilda Sweet', color: 'yellow', ability: '더 적은 command로 업로드' },
  { id: 'hettie-magnetic', name: 'Hettie Magnetic', color: 'blue', ability: '이동 시 말 1 추가 운반' },
  { id: 'angel-nitrate', name: 'Angel Nitrate', color: 'purple', ability: 'Spark를 인접 칸으로 리다이렉트' },
  { id: 'leiko-mori', name: 'Leiko Mori', color: 'purple', ability: '시작 타입을 셋업 중 선택' },
  { id: 'rupert-stanz', name: 'Rupert Stanz', color: 'purple', ability: '특수 말을 supply에서 투입' },
  { id: 'tokyo-black', name: 'Tokyo Black', color: 'gray', ability: '현재 서버 타일 재배치' },
  { id: 'kelly-nexus', name: 'Kelly Nexus', color: 'gray', ability: '첫 두 턴 카드 2장 추가 보유' },
  { id: 'techno-twins', name: 'The Techno Twins', color: 'gray', ability: '아바타 2개 독립 행동' },
]

export const DECKER_COLORS = {
  red: '#e0655e', green: '#6ec98a', yellow: '#dcb64f',
  blue: '#5aa9e6', purple: '#a473d6', gray: '#9a94b3',
}

// 목표 카드. code = 보드 열 약어(Gold), body = 확보한 전문(있으면).
export const OBJECTIVE_CARDS = [
  // Copper 12
  { id: 'copper-404-not-found', name: '404 Not Found', security: 'copper',
    goal: '각 Decker home server 4번 칸에 모든 [Spark]·[Guardian]이 없어야 함',
    rules: 'Command Phase 중 [Spark]가 6번 칸에 들어오려 하면 대신 같은 서버 4번 칸에 배치',
    fail: '모든 서버(home 외 포함) 1번 칸마다 [Spark] 1개' },
  { id: 'copper-access-denied', name: 'Access Denied', security: 'copper' },
  { id: 'copper-alert-to-our-presence', name: 'Alert to our Presence', security: 'copper' },
  { id: 'copper-clockwork-plague', name: 'Clockwork Plague', security: 'copper' },
  { id: 'copper-double-switch', name: 'Double-Switch', security: 'copper' },
  { id: 'copper-garbage-detail', name: 'Garbage Detail', security: 'copper' },
  { id: 'copper-hot-wire', name: 'Hot-Wire', security: 'copper' },
  { id: 'copper-keycode', name: 'Keycode', security: 'copper' },
  { id: 'copper-knowledge-price-freedom', name: 'Knowledge is the Price of Freedom', security: 'copper' },
  { id: 'copper-misdirection', name: 'Misdirection', security: 'copper' },
  { id: 'copper-roman-candle', name: 'Roman Candle', security: 'copper' },
  { id: 'copper-shattered-glass', name: 'Shattered Glass', security: 'copper',
    goal: '이 카드 위에 최소 X개의 [말]',
    setup: '각 Decker는 자기 entry space의 [X] 1개를 [Y] 1개로 교체 가능',
    rules: 'Modify 액션 시 supply에서 [X] 1개를 카드 위에 올림' },
  // Silver 12
  { id: 'silver-access-shutdown', name: 'Access Shutdown', security: 'silver',
    success: '모든 서버 4번 칸마다 [X] 1개',
    fail: '4·5번 칸에 [X]/[Y] 있는 각 서버 6번 칸에 [X] 1개' },
  { id: 'silver-data-overload', name: 'Data Overload', security: 'silver' },
  { id: 'silver-dreams-in-vermilion', name: 'Dreams in Vermilion', security: 'silver' },
  { id: 'silver-fireworks', name: 'Fireworks', security: 'silver' },
  { id: 'silver-hackers-palace', name: "Hacker's Palace", security: 'silver' },
  { id: 'silver-jacobs-ladder', name: "Jacob's Ladder", security: 'silver' },
  { id: 'silver-neural-matrix', name: 'Neural Matrix', security: 'silver',
    goal: 'X개 서버의 각 홀수 칸에 최소 1개의 [X]/[Y] (X = Decker 수 + 1)',
    rules: '특수 규칙 없음' },
  { id: 'silver-null-and-void', name: 'Null & Void', security: 'silver' },
  { id: 'silver-reduct-or-reboot', name: 'Reduct or Reboot', security: 'silver' },
  { id: 'silver-scrambler', name: 'Scrambler', security: 'silver' },
  { id: 'silver-swarm', name: 'Swarm', security: 'silver' },
  { id: 'silver-viral-overload', name: 'Viral Overload', security: 'silver' },
  // Gold 12 (도장 축) — code 는 보드 열 약어
  { id: 'gold-blackout', name: 'Blackout', security: 'gold', code: 'BLK',
    goal: '각 Decker home server 1·3·5번 칸에 최소 1개의 [X]/[Y]. 모든 avatar가 entry space에',
    setup: '각 Decker home server 1·3·5번 칸에서 모든 [Spark] 제거',
    rules: 'Command Phase 중 avatar는 Move로 1·3·5번 칸 진입 불가(ghost는 가능)',
    success: '각 Decker entry space에 [X] 1개' },
  { id: 'gold-distributed-defense', name: 'Distributed Defense', security: 'gold', code: 'DDF' },
  { id: 'gold-dni-web', name: 'DNI Web', security: 'gold', code: 'DNI' },
  { id: 'gold-flash-flood', name: 'Flash Flood', security: 'gold', code: 'FLD' },
  { id: 'gold-hackman', name: 'HackMan', security: 'gold', code: 'HAK',
    goal: '① HackMan 제거([Guardian] 제거하듯) ② 모든 avatar가 각자 entry space에',
    setup: 'supply(비면 network)에서 [X] 1개를 [Y] 위에 쌓음 = "HackMan"',
    rules: 'HackMan과 모든 [말]은 [Guardian]처럼 작동. 매 Start of Turn마다 Active Decker 칸으로 이동' },
  { id: 'gold-insert-misinformation', name: 'Insert Misinformation', security: 'gold', code: 'INS' },
  { id: 'gold-message-queue', name: 'Message Queue', security: 'gold', code: 'MSG' },
  { id: 'gold-mirror-map', name: 'Mirror Map', security: 'gold', code: 'MIR' },
  { id: 'gold-neutrino-scanner', name: 'Neutrino-Scanner', security: 'gold', code: 'NEU' },
  { id: 'gold-roman-road', name: 'Roman Road', security: 'gold', code: 'ROM' },
  { id: 'gold-simsmudge', name: 'SimSmudge', security: 'gold', code: 'SIM' },
  { id: 'gold-waterfall', name: 'Waterfall', security: 'gold', code: 'WTR' },
  // Mother's Ghost (Gold 2.X) 4 — 변형 전용
  { id: 'ghost-shellshock', name: 'Shellshock', security: 'ghost' },
  { id: 'ghost-tempest', name: 'Tempest', security: 'ghost' },
  { id: 'ghost-titanium', name: 'Titanium', security: 'ghost' },
  { id: 'ghost-tsunami', name: 'Tsunami', security: 'ghost' },
]

// 편의 인덱스/필터
export const byId = (arr) => Object.fromEntries(arr.map((x) => [x.id, x]))
export const SMC_BY_ID = byId(SMCS)
export const DECKER_BY_ID = byId(DECKERS)
export const CARD_BY_ID = byId(OBJECTIVE_CARDS)
export const COPPERS = OBJECTIVE_CARDS.filter((c) => c.security === 'copper')
export const SILVERS = OBJECTIVE_CARDS.filter((c) => c.security === 'silver')
export const GOLDS = OBJECTIVE_CARDS.filter((c) => c.security === 'gold')
export const SECURITY_COLORS = { copper: '#d18a57', silver: '#c3c7d4', gold: '#dcb64f', ghost: '#a473d6' }
