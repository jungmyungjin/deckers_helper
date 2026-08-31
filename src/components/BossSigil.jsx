// 보스(SMC) 상징 7종.
//
// favicon.svg 와 같은 문법으로 그렸다 — 32 그리드, 둥근 끝, gold 주색에 cyan 강조 하나.
// 7개가 한 세트로 묶여 보이는 게 개별 그림의 완성도보다 중요하다. 목록에서 나란히
// 놓이기 때문이다. 그래서 spider 는 다리를 꺾어 mother 의 방사형과 실루엣이 겹치지
// 않게 했다.
//
// 형태는 각 보스의 규칙에서 왔다. 게임 테마가 "인류에 등돌린 초거대 컴퓨터"이고
// 목표 카드 이름도 전부 컴퓨터 용어라, 이름을 생물로 읽지 않았다.
//
// 파일이 아니라 인라인 SVG인 이유: 요청 없이 번들에 들어가 오프라인에서도 뜨고,
// 색을 CSS 변수로 두어 테마와 한 곳에서 관리된다.

const SIGILS = {
  // 1세대 메인프레임 — 둥근 상단은 고래의 등, 안쪽 선은 랙 슬롯
  'alpha-moby': { sw: '2', glyph: (
    <>
      <path d="M5.5 24.5a10.5 10.5 0 0 1 21 0" stroke="var(--gold)" />
      <path d="M5.5 24.5h21" stroke="var(--gold)" />
      <path d="M11 15.5h10" stroke="var(--line-soft)" />
      <path d="M10 20h12" stroke="var(--line-soft)" />
      <path d="M10 20h5" stroke="var(--cyan)" />
      <circle cx="21" cy="15.5" r="1.5" fill="var(--cyan)" />
    </>
  ) },
  // 크롤러 — 꺾인 다리로 망을 기어다니며 포위한다
  'spider': { sw: '1.9', glyph: (
    <>
      <circle cx="16" cy="18.5" r="3.6" stroke="var(--gold)" />
      <circle cx="16" cy="12.8" r="2" stroke="var(--gold)" />
      <path d="M12.6 16.5L8.5 12.5 5 15.5M12.4 19L7 19 4.5 22.5M13 21.5L9 25 7 28.5" stroke="var(--gold)" />
      <path d="M19.4 16.5L23.5 12.5 27 15.5M19.6 19L25 19 27.5 22.5M19 21.5L23 25 25 28.5" stroke="var(--gold)" />
    </>
  ) },
  // 응집 프로세스 — 흩어진 덩어리가 겹쳐 하나로 뭉친다
  'glom': { sw: '2', glyph: (
    <>
      <circle cx="12" cy="13.5" r="5.5" stroke="var(--gold)" />
      <circle cx="20" cy="13.5" r="5.5" stroke="var(--gold)" />
      <circle cx="16" cy="20.5" r="5.5" stroke="var(--gold)" />
      <circle cx="16" cy="16" r="1.6" fill="var(--cyan)" />
    </>
  ) },
  // 결정론적 알고리즘 — 주사위를 쓰지 않는 유일한 보스
  'logi': { sw: '2', glyph: (
    <>
      <path d="M16 4.5l10.5 5.8v11.4L16 27.5 5.5 21.7V10.3z" stroke="var(--gold)" />
      <path d="M5.5 10.3L16 16l10.5-5.7M16 16v11.5" stroke="var(--cyan)" />
    </>
  ) },
  // 약탈형 침입 — Guardian 을 불러내는 뿔 투구
  'viking': { sw: '2', glyph: (
    <>
      <path d="M10 19.5a6 6 0 0 1 12 0" stroke="var(--gold)" />
      <path d="M9 19.5h14" stroke="var(--gold)" />
      <path d="M16 15.8v3.7" stroke="var(--cyan)" />
      <path d="M10.3 15.6C7 15 5.5 11.6 6.1 8.5c3 .6 4.6 3.3 4.6 6.1" stroke="var(--gold)" />
      <path d="M21.7 15.6c3.3-.6 4.8-4 4.2-7.1-3 .6-4.6 3.3-4.6 6.1" stroke="var(--gold)" />
    </>
  ) },
  // 방화벽 — 목표를 하나도 빠뜨릴 수 없다
  'sentinel': { sw: '2', glyph: (
    <>
      <path d="M16 4.5l9.5 3.2v7.1c0 6.2-4.2 10.3-9.5 12.2-5.3-1.9-9.5-6-9.5-12.2V7.7z" stroke="var(--gold)" />
      <path d="M12 15.5h8" stroke="var(--cyan)" strokeWidth="2.6" />
    </>
  ) },
  // 코어 그 자체 — 사방으로 Spark 를 내보낸다
  'mother': { sw: '2', glyph: (
    <>
      <circle cx="16" cy="16" r="4.2" stroke="var(--gold)" />
      <circle cx="16" cy="16" r="1.6" fill="var(--cyan)" />
      <path d="M16 4.5v3.5M16 24v3.5M4.5 16h3.5M24 16h3.5M8.2 8.2l2.5 2.5M21.3 21.3l2.5 2.5M23.8 8.2l-2.5 2.5M10.7 21.3l-2.5 2.5" stroke="var(--gold)" />
    </>
  ) },
}

export const hasBossSigil = (smcId) => !!SIGILS[smcId]

export default function BossSigil({ smcId, className = '' }) {
  const sigil = SIGILS[smcId]
  if (!sigil) return null   // 새 SMC 가 늘어도 화면이 깨지지 않는다
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none"
      strokeWidth={sigil.sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {sigil.glyph}
    </svg>
  )
}
