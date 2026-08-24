# Supabase 연동 설정

앱은 **Supabase 없이도 게스트/로컬 모드**로 완전히 동작한다. 아래는 로그인·동기화를 켤 때만 필요.

## 1. Supabase 프로젝트 생성

1. https://supabase.com 에서 프로젝트 생성.
2. **SQL Editor**에서 [`db/schema.sql`](../db/schema.sql) 전체를 붙여넣고 실행 → 테이블·RLS·뷰·시드 생성.

## 2. Google 로그인(OAuth) 설정

1. Supabase 대시보드 → **Authentication → Providers → Google** 활성화.
2. Google Cloud Console에서 OAuth 클라이언트 생성, 다음을 등록:
   - **Authorized redirect URI:** `https://<프로젝트>.supabase.co/auth/v1/callback`
3. 발급된 Client ID / Secret을 Supabase Google provider에 입력.
4. Supabase → **Authentication → URL Configuration → Redirect URLs**에 앱 주소 추가
   (개발: `http://localhost:5173`, 배포: 실제 도메인).

## 3. 앱 환경변수

프로젝트 루트에 `.env` 생성 ([.env.example](../.env.example) 참고):

```
VITE_SUPABASE_URL=https://<프로젝트>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon public key>
```

dev 서버 재시작하면 프로필 화면의 **Google 로그인** 버튼이 활성화된다.

## 4. 동작 방식

- **게스트:** 모든 기록이 이 기기(IndexedDB)에만 저장.
- **로그인:** 로그인 즉시 자동 동기화 1회 + 프로필의 `🔄 동기화` 버튼으로 수동 동기화.
- **병합 정책:** `run.id`(로컬 생성 UUID)를 양쪽 PK로 사용 → **union by id**(같은 id 중복 없음).
  - 로컬의 미동기화 런 → 서버 업로드
  - 서버의 새 런 → 로컬 다운로드
- 코드: [`src/lib/useAuth.js`](../src/lib/useAuth.js), [`src/lib/sync.js`](../src/lib/sync.js)

## 향후 개선 여지

- 삭제 동기화(현재는 추가/수정 중심 — 삭제는 로컬만).
- 충돌 정책 고도화(현재 union by id로 단순화 — Q6).
- `updated_at` 기반 last-write-wins.
