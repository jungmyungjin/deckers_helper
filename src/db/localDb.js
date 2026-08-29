import Dexie from 'dexie'

// 오프라인 퍼스트 로컬 DB. 유저 데이터(runs)만 저장 — 서버 스키마와 1:1.
// run = { id, smcId, smcUpgrade, playedAt, outcome, note, deletedAt, updatedAt, dirty,
//         deckers:[{deckerId, playerName}],
//         objectives:[{cycleNo, objectiveId, security, result, isFinal}] }
//
//   dirty     1 = 아직 서버에 올리지 못한 로컬 변경. push 성공 시에만 0으로.
//   deletedAt 삭제 tombstone. 화면에서는 숨기되 행은 남겨야 pull이 되살리지 않는다.
//   updatedAt 서버가 찍어준 값. null = 아직 한 번도 올라간 적 없음.
export const db = new Dexie('deckers_helper')

db.version(1).stores({
  runs: 'id, smcId, playedAt, outcome, synced',
})

// deletedAt 은 인덱싱하지 않는다 — IndexedDB는 null을 키로 색인하지 못해
// "살아있는 런"을 인덱스로 못 거른다. 메모리에서 거르는 편이 정확하다.
db.version(2).stores({
  runs: 'id, smcId, playedAt, outcome, dirty',
  meta: 'key',
}).upgrade((tx) =>
  tx.table('runs').toCollection().modify((r) => {
    r.dirty = r.synced ? 0 : 1
    r.deletedAt = null
    r.updatedAt = null
    delete r.synced
  })
)

// 오류/제안 제보도 런과 같은 오프라인 큐를 탄다.
// report = { id, kind, message, context, createdAt, dirty }
db.version(3).stores({
  runs: 'id, smcId, playedAt, outcome, dirty',
  meta: 'key',
  reports: 'id, dirty, createdAt',
})

export function newId() {
  return (crypto?.randomUUID?.() ?? String(Date.now()) + Math.random().toString(16).slice(2))
}

// ---- 동기화 커서 등 잡다한 키/값 ----
export async function getMeta(key, fallback = null) {
  const row = await db.meta.get(key)
  return row ? row.value : fallback
}

export async function setMeta(key, value) {
  await db.meta.put({ key, value })
}
