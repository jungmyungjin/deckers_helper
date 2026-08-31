import { useSyncExternalStore } from 'react'
import ko from './ko.json'
import en from './en.json'
import de from './de.json'

export const LOCALES = [
  { code: 'ko', label: '한국어' },
  { code: 'en', label: 'English' },
  { code: 'de', label: 'Deutsch' },
]

export const FALLBACK = 'en'
const BUNDLES = { ko, en, de }
const STORAGE_KEY = 'deckers.locale'

// 로케일은 React 컨텍스트가 아니라 모듈 상태로 둔다.
// ErrorBoundary는 Provider보다 바깥에 있어야 하는데(Provider가 터져도 잡아야 하므로)
// 컨텍스트로 만들면 크래시 화면만 번역이 안 된다. t()를 어디서든 부를 수 있게 한다.
let current = detect()
const listeners = new Set()

function detect() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && BUNDLES[saved]) return saved
  } catch { /* 사생활 보호 모드 등 — 추정으로 넘어간다 */ }

  // 'ko-KR' → 'ko'. 지원하지 않는 언어면 영어.
  for (const tag of navigator.languages || [navigator.language || '']) {
    const base = String(tag).toLowerCase().split('-')[0]
    if (BUNDLES[base]) return base
  }
  return FALLBACK
}

export function getLocale() {
  return current
}

export function setLocale(next) {
  if (!BUNDLES[next] || next === current) return
  current = next
  try { localStorage.setItem(STORAGE_KEY, next) } catch { /* 저장 못 해도 이번 세션은 동작 */ }
  syncDocumentMeta()
  listeners.forEach((fn) => fn())
}

// <html lang> 을 맞춰두면 CSS에서 :lang(ko) 로 한글 전용 서체·자간을 덮어쓸 수 있고
// 스크린 리더도 올바른 언어로 읽는다.
//
// 탭 제목도 함께 맞춘다. index.html 의 <title> 은 정적이라 언어를 따라가지 못했다 —
// 탭을 여러 개 띄워두면 어느 것이 이 앱인지 한글 사용자에게는 안 잡힌다.
// 크롤러가 보는 값은 여전히 index.html 쪽이다(JS 실행 전에 읽으므로).
export function syncDocumentMeta() {
  document.documentElement.lang = current
  document.title = t('app.title')
}

function subscribe(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

// ---- 문구 조회 ----

function lookup(bundle, key) {
  return key.split('.').reduce((o, part) => (o == null ? undefined : o[part]), bundle)
}

// 복수형: 한국어는 형태가 하나라 항상 'other'. 영어·독일어는 one/other로 갈린다.
const pluralRules = {}
function pluralForm(locale, count) {
  if (!pluralRules[locale]) {
    pluralRules[locale] = new Intl.PluralRules(locale)
  }
  return pluralRules[locale].select(count)
}

/**
 * t('history.title')
 * t('shuffle.remaining', { count: 37 })   // {count} 보간 + 복수형 분기
 *
 * 값이 객체면 복수형 키({ one, other })로 보고 count 에 맞춰 고른다.
 * 현재 로케일에 없으면 영어로, 그것도 없으면 키 자체를 돌려준다(누락이 눈에 띄도록).
 */
export function t(key, vars) {
  let raw = lookup(BUNDLES[current], key)
  if (raw == null) raw = lookup(BUNDLES[FALLBACK], key)
  if (raw == null) return key

  if (typeof raw === 'object') {
    const form = pluralForm(current, Number(vars?.count ?? 0))
    raw = raw[form] ?? raw.other ?? key
  }

  if (!vars) return raw
  return String(raw).replace(/\{(\w+)\}/g, (m, name) =>
    (vars[name] == null ? m : String(vars[name]))
  )
}

// ---- React 바인딩 ----

/** 언어가 바뀌면 다시 렌더된다. const { t, locale } = useT() */
export function useT() {
  const locale = useSyncExternalStore(subscribe, getLocale, () => FALLBACK)
  return { t, locale, setLocale }
}
