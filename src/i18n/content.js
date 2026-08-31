import { FALLBACK, getLocale } from './index'
import ko from '../data/content/ko.json'
import en from '../data/content/en.json'
import de from '../data/content/de.json'

// 게임 콘텐츠(이름·능력·카드 본문) 조회.
// UI 문구와 파일을 나눈 이유: UI는 우리가 자유롭게 쓰는 글이지만, 이쪽은
// 실물 카드에 인쇄된 문구와 일치해야 하는 값이라 성격이 다르다.
//
// 폴백은 필드 단위다. 한국어판 카드명을 아직 안 넣었어도 영어 이름이 나오고,
// 본문만 한국어로 보인다. 판본을 하나씩 채워 나갈 수 있다.
const CONTENT = { ko, en, de }

function field(kind, id, key) {
  const locale = getLocale()
  const mine = CONTENT[locale]?.[kind]?.[id]?.[key]
  if (mine) return mine
  return CONTENT[FALLBACK]?.[kind]?.[id]?.[key]
}

/** 이름이 어느 판본에도 없으면 id 를 그대로 — 빠진 게 눈에 띄도록 */
export const smcName = (id) => field('smc', id, 'name') || id
export const deckerName = (id) => field('decker', id, 'name') || id
export const cardName = (id) => field('card', id, 'name') || id

export const smcSpecial = (id) => field('smc', id, 'special')
export const deckerAbility = (id) => field('decker', id, 'ability')

/** 카드 본문 전체. 없는 필드는 undefined — 화면에서 "실물 카드 참고"로 처리한다. */
export function cardText(id) {
  return {
    goal: field('card', id, 'goal'),
    setup: field('card', id, 'setup'),
    rules: field('card', id, 'rules'),
    success: field('card', id, 'success'),
    fail: field('card', id, 'fail'),
    flavor_success: field('card', id, 'flavor_success'),
    flavor_fail: field('card', id, 'flavor_fail'),
  }
}

export const hasCardBody = (id) => {
  const c = cardText(id)
  return !!(c.goal || c.rules || c.setup)
}
export const hasCardResult = (id) => {
  const c = cardText(id)
  return !!(c.success || c.fail)
}
