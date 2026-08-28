// Deckers 참조 데이터 — 언어 무관 뼈대만.
//
// 이름·능력·카드 본문처럼 판본(언어)에 따라 달라지는 값은 여기 없다.
// src/data/content/{ko,en,de}.json 에 있고 src/i18n/content.js 로 조회한다.
// 여기 있는 id 는 기록(runs)에 그대로 저장되므로 절대 바꾸면 안 된다.

export const SMCS = [
  { id: 'alpha-moby', difficulty: 1, cycles: 3 },
  { id: 'spider', difficulty: 2, cycles: 4 },
  { id: 'glom', difficulty: 2, cycles: 4 },
  { id: 'logi', difficulty: 2, cycles: 4 },
  { id: 'viking', difficulty: 3, cycles: 4 },
  { id: 'sentinel', difficulty: 4, cycles: 5 },
  { id: 'mother', difficulty: 4, cycles: 5 },
]

export const DECKERS = [
  { id: 'oshin-noro', color: 'red' },
  { id: 'monty-quantum', color: 'green' },
  { id: 'tilda-sweet', color: 'yellow' },
  { id: 'hettie-magnetic', color: 'blue' },
  { id: 'angel-nitrate', color: 'purple' },
  { id: 'leiko-mori', color: 'purple' },
  { id: 'rupert-stanz', color: 'purple' },
  { id: 'tokyo-black', color: 'gray' },
  { id: 'kelly-nexus', color: 'gray' },
  { id: 'techno-twins', color: 'gray' },
]

export const DECKER_COLORS = {
  red: '#e0655e', green: '#6ec98a', yellow: '#dcb64f',
  blue: '#5aa9e6', purple: '#a473d6', gray: '#9a94b3',
}

// 목표 카드 40장. code = 84칸 보드의 열 약어(Gold 전용).
// code 는 일부러 언어와 무관하게 둔다 — 언어를 바꿔도 84칸 보드 레이아웃이
// 그대로 유지되고, 현지 이름은 툴팁과 범례에서 보여준다.
export const OBJECTIVE_CARDS = [
  // Copper 12
  { id: 'copper-404-not-found', security: 'copper' },
  { id: 'copper-access-denied', security: 'copper' },
  { id: 'copper-alert-to-our-presence', security: 'copper' },
  { id: 'copper-clockwork-plague', security: 'copper' },
  { id: 'copper-double-switch', security: 'copper' },
  { id: 'copper-garbage-detail', security: 'copper' },
  { id: 'copper-hot-wire', security: 'copper' },
  { id: 'copper-keycode', security: 'copper' },
  { id: 'copper-knowledge-price-freedom', security: 'copper' },
  { id: 'copper-misdirection', security: 'copper' },
  { id: 'copper-roman-candle', security: 'copper' },
  { id: 'copper-shattered-glass', security: 'copper' },
  // Silver 12
  { id: 'silver-access-shutdown', security: 'silver' },
  { id: 'silver-data-overload', security: 'silver' },
  { id: 'silver-dreams-in-vermilion', security: 'silver' },
  { id: 'silver-fireworks', security: 'silver' },
  { id: 'silver-hackers-palace', security: 'silver' },
  { id: 'silver-jacobs-ladder', security: 'silver' },
  { id: 'silver-neural-matrix', security: 'silver' },
  { id: 'silver-null-and-void', security: 'silver' },
  { id: 'silver-reduct-or-reboot', security: 'silver' },
  { id: 'silver-scrambler', security: 'silver' },
  { id: 'silver-swarm', security: 'silver' },
  { id: 'silver-viral-overload', security: 'silver' },
  // Gold 12 (클리어 축)
  { id: 'gold-blackout', security: 'gold', code: 'BLK' },
  { id: 'gold-distributed-defense', security: 'gold', code: 'DDF' },
  { id: 'gold-dni-web', security: 'gold', code: 'DNI' },
  { id: 'gold-flash-flood', security: 'gold', code: 'FLD' },
  { id: 'gold-hackman', security: 'gold', code: 'HAK' },
  { id: 'gold-insert-misinformation', security: 'gold', code: 'INS' },
  { id: 'gold-message-queue', security: 'gold', code: 'MSG' },
  { id: 'gold-mirror-map', security: 'gold', code: 'MIR' },
  { id: 'gold-neutrino-scanner', security: 'gold', code: 'NEU' },
  { id: 'gold-roman-road', security: 'gold', code: 'ROM' },
  { id: 'gold-simsmudge', security: 'gold', code: 'SIM' },
  { id: 'gold-waterfall', security: 'gold', code: 'WTR' },
  // Mother's Ghost (Gold 2.X) 4 — 변형 전용
  { id: 'ghost-shellshock', security: 'ghost' },
  { id: 'ghost-tempest', security: 'ghost' },
  { id: 'ghost-titanium', security: 'ghost' },
  { id: 'ghost-tsunami', security: 'ghost' },
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

// tier 는 저장하지 않는다 — difficulty 에서 파생되는 표시용 라벨이라
// i18n 문구(game.tier.*)로 처리한다.
export function tierKey(difficulty) {
  if (difficulty <= 1) return 'intro'
  if (difficulty <= 3) return 'mid'
  return 'top'
}
