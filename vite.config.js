import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// 제보에 어느 빌드에서 난 오류인지 붙이기 위해 주입한다.
// 버전 번호만으로는 부족하다 — 손으로 올리는 값이라 배포를 열 번 해도 0.1.0 그대로고,
// PWA가 autoUpdate라 사용자마다 실제로 돌고 있는 빌드가 다르다. 커밋 SHA를 함께 붙인다.
const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))

function commitSha() {
  // CI 체크아웃은 얕거나 git 자체가 없을 수 있어 환경변수를 먼저 본다
  const fromCI = process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA
  if (fromCI) return fromCI.slice(0, 7)
  try {
    return execSync('git rev-parse --short=7 HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString().trim()
  } catch {
    return null   // git 없이 받은 소스로 빌드하는 경우 — 버전 번호만으로 간다
  }
}

const sha = commitSha()
const appVersion = sha ? `${pkg.version}+${sha}` : pkg.version

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        // manifest 는 언어를 하나만 담을 수 있어 로마자로 고정한다.
        // 앱 안의 문구는 src/i18n 이 3개 언어로 처리한다.
        name: 'Deckers Challenge Log',
        short_name: 'Deckers',
        description: 'Run log, card reference and progress for the board game Deckers',
        theme_color: '#0e0c15',
        background_color: '#0e0c15',
        display: 'standalone',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      }
    })
  ]
})
