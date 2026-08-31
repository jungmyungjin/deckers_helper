// 앱 마크. public/icon-*.png · favicon.svg · og.png 이 모두 같은 도형을 쓴다 —
// 홈 화면 아이콘에서 본 것과 앱 안에서 보는 것이 같아야 "그 앱"으로 이어진다.
// 파일이 아니라 인라인 SVG인 이유: 요청 없이 번들에 들어가 오프라인에서도 뜨고,
// 색을 CSS 변수로 두어 테마와 한 곳에서 관리된다.
export default function BrandMark({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <path fill="var(--gold)" fillRule="evenodd"
        d="M15 12h25l12 12v16L40 52H15zM25 22v20h11l7-7v-6l-7-7z" />
      <path d="M29 32h9" stroke="var(--cyan)" strokeWidth="4.5" strokeLinecap="round" />
    </svg>
  )
}
