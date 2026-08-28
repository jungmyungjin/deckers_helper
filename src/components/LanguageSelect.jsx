import { LOCALES, useT } from '../i18n'

// 언어 이름은 각자 자기 언어로 쓴다 — UI를 못 읽는 사람이 가장 필요로 하는
// 컨트롤이라, 라벨까지 못 읽으면 의미가 없다.
export default function LanguageSelect({ className = '' }) {
  const { locale, setLocale, t } = useT()

  return (
    <select
      className={'csel langsel ' + className}
      value={locale}
      aria-label={t('profile.languageRow')}
      onChange={(e) => setLocale(e.target.value)}
    >
      {LOCALES.map((l) => (
        <option key={l.code} value={l.code}>{l.label}</option>
      ))}
    </select>
  )
}
