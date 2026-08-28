import { LOCALES, useT } from '../i18n'
import SelectField from './SelectField'

// 언어 이름은 각자 자기 언어로 쓴다 — UI를 못 읽는 사람이 가장 필요로 하는
// 컨트롤이라, 라벨까지 못 읽으면 의미가 없다.
export default function LanguageSelect({ className = '' }) {
  const { locale, setLocale, t } = useT()

  return (
    <SelectField
      className={'langsel ' + className}
      value={locale}
      ariaLabel={t('profile.languageRow')}
      options={LOCALES.map((localeItem) => ({ value: localeItem.code, label: localeItem.label }))}
      onChange={setLocale}
    />
  )
}
