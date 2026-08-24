import Dexie from 'dexie'

// 오프라인 퍼스트 로컬 DB. 유저 데이터(runs)만 저장.
// run = { id, smcId, playedAt, outcome, note, synced,
//         deckers:[{deckerId, playerName}],
//         objectives:[{cycleNo, objectiveId, security, result, isFinal}] }
export const db = new Dexie('deckers_helper')

db.version(1).stores({
  runs: 'id, smcId, playedAt, outcome, synced',
})

export function newId() {
  return (crypto?.randomUUID?.() ?? String(Date.now()) + Math.random().toString(16).slice(2))
}
