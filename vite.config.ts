import { defineConfig, Plugin } from 'vite'
import path from 'node:path'
import { readFileSync } from 'node:fs'
import electron from 'vite-plugin-electron/simple'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'

// package.jsonからバージョンを読み込む
const packageJson = JSON.parse(readFileSync(path.resolve(__dirname, 'package.json'), 'utf-8'))
const version = packageJson.version

// HTMLのタイトルにバージョンを注入するプラグイン
function htmlVersionPlugin(): Plugin {
  return {
    name: 'html-version-plugin',
    transformIndexHtml(html) {
      return html.replace(
        /<title>.*?<\/title>/,
        `<title>TruckStacker ${version}</title>`
      )
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  base: './', // ★追加：Electron(file://)向けに必須級
  plugins: [
    vue(),
    vuetify({ autoImport: true }),
    htmlVersionPlugin(),
    electron({
      main: {
        // Shortcut of `build.lib.entry`.
        entry: 'electron/main.ts',
      },
      preload: {
        // Shortcut of `build.rollupOptions.input`.
        // Preload scripts may contain Web assets, so use the `build.rollupOptions.input` instead `build.lib.entry`.
        input: path.join(__dirname, 'electron/preload.ts'),
      },
      // Ployfill the Electron and Node.js API for Renderer process.
      // If you want use Node.js in Renderer process, the `nodeIntegration` needs to be enabled in the Main process.
      // See 👉 https://github.com/electron-vite/vite-plugin-electron-renderer
      renderer: process.env.NODE_ENV === 'test'
        // https://github.com/electron-vite/vite-plugin-electron-renderer/issues/78#issuecomment-2053600808
        ? undefined
        : {},
    }),
  ],
})
