// Deckers 참조 데이터 — 언어 무관 뼈대만.
//
// 이름·능력·카드 본문처럼 판본(언어)에 따라 달라지는 값은 여기 없다.
// src/data/content/{ko,en,de}.json 에 있고 src/i18n/content.js 로 조회한다.
// 여기 있는 id 는 기록(runs)에 그대로 저장되므로 절대 바꾸면 안 된다.

export const SMCS = [
  { id: 'alpha-moby', difficulty: 1, cycles: 3, objectives: { copper: 1, silver: 1, gold: 1 } },
  { id: 'spider', difficulty: 2, cycles: 4, objectives: { copper: 1, silver: 1, gold: 1 } },
  { id: 'glom', difficulty: 2, cycles: 4, objectives: { copper: 1, silver: 1, gold: 1 } },
  { id: 'logi', difficulty: 2, cycles: 4, objectives: { copper: 2, silver: 1, gold: 1 } },
  { id: 'viking', difficulty: 3, cycles: 4, objectives: { copper: 1, silver: 1, gold: 1 } },
  { id: 'sentinel', difficulty: 4, cycles: 5, objectives: { copper: 2, silver: 2, gold: 1 }, requireAllObjectives: true },
  { id: 'mother', difficulty: 4, cycles: 5, objectives: { copper: 1, silver: 2, gold: 1 } },
]

export const DECKERS = [
  { id: 'oshin-noro', profileId: 'red', side: 'primary', color: 'red' },
  { id: 'angel-nitrate', profileId: 'red', side: 'alternate', color: 'red' },
  { id: 'monty-quantum', profileId: 'green', side: 'primary', color: 'green' },
  { id: 'kelly-nexus', profileId: 'green', side: 'alternate', color: 'green' },
  { id: 'tilda-sweet', profileId: 'yellow', side: 'primary', color: 'yellow' },
  { id: 'techno-twins', profileId: 'yellow', side: 'alternate', color: 'yellow' },
  { id: 'hettie-magnetic', profileId: 'blue', side: 'primary', color: 'blue' },
  { id: 'tokyo-black', profileId: 'blue', side: 'alternate', color: 'blue' },
  { id: 'leiko-mori', profileId: 'purple', side: 'primary', color: 'purple' },
  { id: 'rupert-stanz', profileId: 'purple', side: 'alternate', color: 'purple' },
]

export const DECKER_COLORS = {
  red: '#e0655e', green: '#6ec98a', yellow: '#dcb64f',
  blue: '#5aa9e6', purple: '#a473d6', gray: '#9a94b3',
}

// 목표 카드 40장. code = 미션 보드의 열 약어(Gold 전용).
// code 는 일부러 언어와 무관하게 둔다 — 언어를 바꿔도 84칸 레이아웃이
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

// SMC 업그레이드는 보스 고유 특수 규칙에 더해 Gold 목표를 1장 또는 2장 더한다.
// 목표는 Bronze → Silver → Gold 순으로 배치하고, 마지막 Gold만 완주 보드의 기준이다.
export function objectiveCountsFor(smcId, upgradeLevel = 0) {
  const base = SMC_BY_ID[smcId]?.objectives || { copper: 1, silver: 1, gold: 1 }
  const upgrade = Math.min(2, Math.max(0, Number(upgradeLevel) || 0))
  return { ...base, gold: base.gold + upgrade }
}

export function buildObjectiveSlots(smcId, upgradeLevel = 0) {
  const counts = objectiveCountsFor(smcId, upgradeLevel)
  const slots = []
  for (const security of ['copper', 'silver', 'gold']) {
    for (let n = 0; n < counts[security]; n++) {
      slots.push({ cycleNo: slots.length + 1, security, isFinal: false })
    }
  }
  slots[slots.length - 1].isFinal = true
  return slots
}

// 프로필 카드는 양면이다. 다른 플레이어가 한 면을 골랐으면 반대 면도 선택할 수 없다.
export function availableDeckersFor(selectedDeckerIds = []) {
  const usedProfiles = new Set(selectedDeckerIds.map((id) => DECKER_BY_ID[id]?.profileId).filter(Boolean))
  return DECKERS.filter((decker) => !usedProfiles.has(decker.profileId))
}

// tier 는 저장하지 않는다 — difficulty 에서 파생되는 표시용 라벨이라
// i18n 문구(game.tier.*)로 처리한다.
export function tierKey(difficulty) {
  if (difficulty <= 1) return 'intro'
  if (difficulty <= 3) return 'mid'
  return 'top'
}
