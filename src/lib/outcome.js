// 결과 판정: 최종 Gold 실패→fail / 전부 성공→perfect / 그 외→success
export function calcOutcome(objectives, options = {}) {
  if (!objectives || objectives.length === 0) return 'success'
  const finalGold = objectives.find((o) => o.isFinal && o.security === 'gold')
  if (finalGold && finalGold.result === 'fail') return 'fail'
  if (options.requireAllObjectives && objectives.some((o) => o.result === 'fail')) return 'fail'
  // 안전장치: 최종이 명시 안 됐어도 gold 실패면 fail 취급
  const anyGoldFail = objectives.some((o) => o.security === 'gold' && o.result === 'fail')
  if (anyGoldFail && !objectives.some((o) => o.isFinal)) return 'fail'
  if (objectives.every((o) => o.result === 'success')) return 'perfect'
  return 'success'
}

// 아이콘·색만. 라벨은 i18n(outcome.*)에서 가져온다.
export const OUTCOME_META = {
  fail: { icon: '✕', color: 'var(--danger)' },
  success: { icon: '✓', color: 'var(--safe)' },
  perfect: { icon: '🥇', color: 'var(--gold)' },
}
