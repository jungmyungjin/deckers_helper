import { getLocale } from '../i18n'

// History와 MissionDetail에 거의 같은 포맷 함수가 복사돼 있었고 M/D 순서가
// 하드코딩이었다. 독일어권은 D.M. 이라 Intl에 맡긴다.
const cache = new Map()

function fmt(kind, options) {
  const key = getLocale() + ':' + kind
  if (!cache.has(key)) {
    cache.set(key, new Intl.DateTimeFormat(getLocale(), options))
  }
  return cache.get(key)
}

/** 히스토리 목록: 날짜와 시각을 두 줄로 */
export function formatDateTimeStacked(iso) {
  const d = new Date(iso)
  return `${fmt('date', { month: 'numeric', day: 'numeric' }).format(d)}\n` +
    `${fmt('time', { hour: '2-digit', minute: '2-digit', hour12: false }).format(d)}`
}

/** 미션 상세: 한 줄 */
export function formatDateTime(iso) {
  const d = new Date(iso)
  return `${fmt('date', { month: 'numeric', day: 'numeric' }).format(d)} ` +
    `${fmt('time', { hour: '2-digit', minute: '2-digit', hour12: false }).format(d)}`
}
