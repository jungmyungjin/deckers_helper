import { useLiveQuery } from 'dexie-react-hooks'
import { db, newId } from './localDb'
import { supabase, hasSupabase } from '../lib/supabase'
import { pushReports } from '../lib/sync'
import { getLocale, t } from '../i18n'

// vite.config.js 가 package.json 버전을 주입한다. dev 서버에서는 Vite가
// typeof 안의 식별자를 치환하지 않아 'dev'로 남는데, 개발 중 제보와
// 배포본 제보를 구분해주므로 그대로 둔다.
/* global __APP_VERSION__ */
export const APP_VERSION = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : 'dev'

// 제보와 함께 보낼 상황 정보. 제보자가 손으로 쓰지 않아도 되도록 앱이 모은다 —
// "어디서 안 되는지"를 알아내는 데 실제로 쓰이는 값만 담고, 화면에도 그대로 보여준다.
//   account: 크래시 화면처럼 세션을 알 수 없는 곳에서는 'unknown'을 넘긴다.
//            (행의 user_id는 전송 시점에 채워지므로 이 값은 참고용이다)
export async function collectContext({ user, account, syncStatus, syncMessage } = {}) {
  const runCount = await db.runs.count().catch(() => null)
  return {
    appVersion: APP_VERSION,
    route: window.location.hash || '#/',
    account: account || (user ? 'signed-in' : 'guest'),
    online: navigator.onLine,
    standalone: window.matchMedia?.('(display-mode: standalone)').matches ?? false,
    syncStatus: syncStatus || 'idle',
    syncMessage: syncMessage || null,
    runCount,
    screen: `${window.screen.width}x${window.screen.height}`,
    locale: getLocale(),          // 앱에 설정된 언어
    language: navigator.language, // 기기 언어
    userAgent: navigator.userAgent,
    at: new Date().toISOString(),
  }
}

// 저장되는 값은 개발자가 볼 원본 그대로(예: '#/mission/mother/gold-hackman') 두고,
// 화면에 보여줄 때만 현재 언어로 옮긴다.
const ROUTE_KEYS = {
  '#/': 'board',
  '#/history': 'history',
  '#/shuffle': 'shuffle',
  '#/new': 'new',
  '#/cards': 'cards',
  '#/profile': 'profile',
  '#/report': 'report',
}

const SYNC_STATUS_KEYS = {
  idle: 'sync.statusIdle',
  syncing: 'sync.statusSyncing',
  done: 'sync.statusDone',
  error: 'sync.statusError',
}

function routeName(route) {
  if (!route) return '\u2014'
  if (ROUTE_KEYS[route]) return t(`report.route.${ROUTE_KEYS[route]}`)
  if (route.startsWith('#/mission/')) return t('report.route.mission')
  return route
}

// 사람이 읽을 수 있게 요약 — 폼에서 "무엇이 함께 가는지" 보여줄 때 쓴다
export function describeContext(ctx) {
  if (!ctx) return []
  const statusKey = SYNC_STATUS_KEYS[ctx.syncStatus]
  const sync = statusKey ? t(statusKey) : (ctx.syncStatus || '\u2014')
  const account = ctx.account === 'signed-in' ? 'accountSignedIn'
    : ctx.account === 'guest' ? 'accountGuest' : 'accountUnknown'
  return [
    [t('report.ctx.appVersion'), ctx.appVersion],
    [t('report.ctx.route'), routeName(ctx.route)],
    [t('report.ctx.account'), t(`report.ctx.${account}`)],
    [t('report.ctx.language'), ctx.locale || getLocale()],
    [t('report.ctx.connection'), t(ctx.online ? 'report.ctx.online' : 'report.ctx.offline')],
    [t('report.ctx.install'), t(ctx.standalone ? 'report.ctx.installApp' : 'report.ctx.installBrowser')],
    [t('report.ctx.sync'), ctx.syncMessage ? `${sync} \u2014 ${ctx.syncMessage}` : sync],
    [t('report.ctx.runCount'), ctx.runCount == null ? '\u2014' : t('report.ctx.runCountValue', { count: ctx.runCount })],
    [t('report.ctx.device'), ctx.userAgent],
  ]
}

export async function saveReport({ kind, message, context }) {
  const report = {
    id: newId(),
    kind: kind === 'crash' ? 'crash' : 'bug',
    message: String(message).trim().slice(0, 2000),
    context: context || {},
    createdAt: new Date().toISOString(),
    dirty: 1,
  }
  await db.reports.add(report)
  return report
}

// 아직 전송하지 못하고 큐에 남아있는 제보 수
export function pendingReportCount() {
  return db.reports.where('dirty').equals(1).count()
}

export function usePendingReportCount() {
  return useLiveQuery(pendingReportCount, [], 0)
}

// 큐에 남은 제보를 지금 보내본다. 크래시 화면처럼 SyncProvider를 쓸 수 없는
// 곳에서 호출한다. 실패해도 큐에 남아 다음 실행에 전송되므로 예외를 삼킨다.
// 반환값: 실제로 전송됐는지
export async function flushReports() {
  if (!hasSupabase || !navigator.onLine) return false
  try {
    const { data } = await supabase.auth.getSession()
    await pushReports(data?.session?.user?.id ?? null)
    return (await pendingReportCount()) === 0
  } catch {
    return false
  }
}
