import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// 제보에 어느 버전에서 난 오류인지 붙이기 위해 package.json 버전을 주입한다
const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
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
