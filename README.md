![Deckers Challenge Log](docs/logo-lockup.png)

보드게임 [Deckers](https://boardgamegeek.com/boardgame/443306/deckers) 컴패니언 PWA.
플레이 기록, 목표 카드 조회, 진행 상황을 한 곳에서 본다.

한국어 · English · Deutsch 지원.

## 실행

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # dist/
npm run preview
```

Supabase 없이도 게스트 모드로 완전히 동작한다. 로그인·기기 간 동기화를 켜려면
[docs/supabase-setup.md](docs/supabase-setup.md) 참고.

## 문서

- [docs/data-model.md](docs/data-model.md) — 데이터 모델과 동기화 규칙
- [docs/i18n.md](docs/i18n.md) — 다국어 구조와 번역 규칙
- [docs/supabase-setup.md](docs/supabase-setup.md) — Supabase·Google 로그인 설정
- [docs/rules-summary.md](docs/rules-summary.md) — 게임 룰 요약
