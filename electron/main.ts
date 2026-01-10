import { app, BrowserWindow, ipcMain, dialog, Menu } from 'electron'
// import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs/promises'
import { autoUpdater } from 'electron-updater'

// const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

// 開発環境かどうかを判定
const isDev = process.env.NODE_ENV === 'development' || !!VITE_DEV_SERVER_URL

let win: BrowserWindow | null

// autoUpdaterの設定
function setupAutoUpdater() {
  if (isDev) {
    console.log('開発環境のため、自動アップデートはスキップされます')
    return
  }

  // 現在のアプリバージョンをログに出力
  console.log('現在のアプリバージョン:', app.getVersion())
  console.log('autoUpdater初期化開始')

  // ログを有効化（デバッグ用）
  // electron-logがインストールされている場合は、以下のコメントを外してください
  // autoUpdater.logger = require('electron-log')
  // autoUpdater.logger.transports.file.level = 'info'

  // 自動ダウンロードを有効化
  autoUpdater.autoDownload = true
  // アプリ終了時に自動インストール
  autoUpdater.autoInstallOnAppQuit = true

  // イベントハンドラー（checkForUpdatesの前に設定する必要がある）
  autoUpdater.on('checking-for-update', () => {
    console.log('[autoUpdater] アップデートをチェック中...')
    console.log('[autoUpdater] 現在のバージョン:', app.getVersion())
    if (win) {
      win.webContents.send('update-checking')
    }
  })

  autoUpdater.on('update-available', (info) => {
    console.log('[autoUpdater] アップデートが利用可能です!')
    console.log('[autoUpdater] 新しいバージョン:', info.version)
    console.log('[autoUpdater] リリースノート:', info.releaseNotes)
    console.log('[autoUpdater] 詳細情報:', JSON.stringify(info, null, 2))
    if (win) {
      win.webContents.send('update-available', info)
      dialog.showMessageBox(win, {
        type: 'info',
        title: 'アップデートが利用可能です',
        message: `バージョン ${info.version} が利用可能です`,
        detail: 'アップデートをダウンロードしますか？',
        buttons: ['ダウンロード', '後で'],
        defaultId: 0,
        cancelId: 1
      }).catch((err) => {
        console.error('ダイアログ表示エラー:', err)
      })
    }
  })

  autoUpdater.on('update-not-available', (info) => {
    console.log('[autoUpdater] アップデートはありません')
    console.log('[autoUpdater] 最新バージョン:', info.version)
    console.log('[autoUpdater] 詳細情報:', JSON.stringify(info, null, 2))
    if (win) {
      win.webContents.send('update-not-available', info)
    }
  })

  autoUpdater.on('error', (err) => {
    console.error('[autoUpdater] エラーが発生しました:')
    console.error('[autoUpdater] エラーメッセージ:', err.message)
    console.error('[autoUpdater] エラースタック:', err.stack)
    console.error('[autoUpdater] エラー詳細:', JSON.stringify({
      message: err.message,
      stack: err.stack,
      code: (err as any).code,
      errno: (err as any).errno,
      name: err.name
    }, null, 2))
    if (win) {
      win.webContents.send('update-error', err.message || '不明なエラーが発生しました')
      dialog.showErrorBox(
        'アップデートエラー',
        `アップデートチェック中にエラーが発生しました:\n${err.message}`
      )
    }
  })

  autoUpdater.on('download-progress', (progressObj) => {
    const percent = Math.round(progressObj.percent)
    const transferred = Math.round(progressObj.transferred / 1024 / 1024 * 100) / 100
    const total = Math.round(progressObj.total / 1024 / 1024 * 100) / 100
    console.log(`[autoUpdater] ダウンロード進捗: ${percent}% (${transferred}MB / ${total}MB)`)
    if (win) {
      win.webContents.send('update-download-progress', progressObj)
    }
  })

  autoUpdater.on('update-downloaded', (info) => {
    console.log('[autoUpdater] アップデートのダウンロードが完了しました!')
    console.log('[autoUpdater] バージョン:', info.version)
    console.log('[autoUpdater] リリース日:', info.releaseDate)
    console.log('[autoUpdater] 詳細情報:', JSON.stringify(info, null, 2))
    if (win) {
      win.webContents.send('update-downloaded', info)
      // ダイアログを表示してユーザーに確認
      dialog.showMessageBox(win, {
        type: 'info',
        title: 'アップデート準備完了',
        message: 'アップデートのダウンロードが完了しました',
        detail: `バージョン ${info.version} がダウンロードされました。アプリを再起動してインストールしますか？`,
        buttons: ['今すぐ再起動', '後で'],
        defaultId: 0,
        cancelId: 1
      }).then((result) => {
        if (result.response === 0) {
          console.log('[autoUpdater] アプリを再起動してアップデートをインストールします')
          autoUpdater.quitAndInstall(false, true)
        } else {
          console.log('[autoUpdater] ユーザーが「後で」を選択しました')
        }
      }).catch((err) => {
        console.error('ダイアログ表示エラー:', err)
      })
    }
  })

  // 初回チェック（アプリ起動時、少し遅延させてウィンドウが完全に読み込まれるのを待つ）
  setTimeout(() => {
    console.log('[autoUpdater] 初回アップデートチェックを開始します...')
    autoUpdater.checkForUpdatesAndNotify().catch((err) => {
      console.error('[autoUpdater] 初回アップデートチェックに失敗しました:', err)
      console.error('[autoUpdater] エラー詳細:', JSON.stringify(err, Object.getOwnPropertyNames(err), 2))
    })
  }, 3000) // 3秒待つ

  // 定期的にチェック（1時間ごと）
  setInterval(() => {
    console.log('[autoUpdater] 定期アップデートチェックを開始します...')
    autoUpdater.checkForUpdatesAndNotify().catch((err) => {
      console.error('[autoUpdater] 定期アップデートチェックに失敗しました:', err)
      console.error('[autoUpdater] エラー詳細:', JSON.stringify(err, Object.getOwnPropertyNames(err), 2))
    })
  }, 60 * 60 * 1000) // 1時間ごと
}

// IPCハンドラーの設定
function setupIpcHandlers() {
  // ファイル読み込み
  ipcMain.handle('read-file', async (_event, filePath: string) => {
    try {
      const content = await fs.readFile(filePath, 'utf-8')
      return { success: true, data: content }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  // ファイル書き込み
  ipcMain.handle('write-file', async (_event, filePath: string, content: string) => {
    try {
      await fs.writeFile(filePath, content, 'utf-8')
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  // ファイルを開くダイアログ
  ipcMain.handle('show-open-dialog', async (_event, options: any) => {
    if (!win) return { canceled: true }
    const result = await dialog.showOpenDialog(win, options)
    return result
  })

  // ファイルを保存するダイアログ
  ipcMain.handle('show-save-dialog', async (_event, options: any) => {
    if (!win) return { canceled: true }
    const result = await dialog.showSaveDialog(win, options)
    return result
  })

  // 現在のアプリバージョンを取得
  ipcMain.handle('get-app-version', async () => {
    return app.getVersion()
  })

  // 手動でアップデートをチェック
  ipcMain.handle('check-for-updates', async () => {
    if (isDev) {
      return { success: false, error: '開発環境ではアップデートチェックは無効です' }
    }
    try {
      console.log('[IPC] 手動アップデートチェックがリクエストされました')
      const result = await autoUpdater.checkForUpdates()
      console.log('[IPC] アップデートチェック結果:', result)
      return { success: true, result }
    } catch (error: any) {
      console.error('[IPC] アップデートチェックエラー:', error)
      return { success: false, error: error.message }
    }
  })
}

// アプリケーションメニューの設定
function setupMenu() {
  const template: any[] = [
    {
      label: 'ファイル',
      submenu: [
        {
          label: 'データをエクスポート',
          click: () => {
            win?.webContents.send('menu-export-data')
          }
        },
        {
          label: 'データをインポート',
          click: () => {
            win?.webContents.send('menu-import-data')
          }
        },
        { type: 'separator' },
        { role: 'quit', label: '終了' }
      ]
    },
    {
      label: '編集',
      submenu: [
        { role: 'undo', label: '元に戻す' },
        { role: 'redo', label: 'やり直す' },
        { type: 'separator' },
        { role: 'cut', label: '切り取り' },
        { role: 'copy', label: 'コピー' },
        { role: 'paste', label: '貼り付け' },
      ]
    },
    {
      label: '表示',
      submenu: [
        { role: 'reload', label: '再読み込み' },
        { role: 'forceReload', label: '強制再読み込み' },
        { role: 'toggleDevTools', label: '開発者ツール' },
        { type: 'separator' },
        { role: 'resetZoom', label: 'ズームをリセット' },
        { role: 'zoomIn', label: '拡大' },
        { role: 'zoomOut', label: '縮小' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'フルスクリーン切替' }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

// アプリ起動時の処理
app.whenReady().then(() => {
  setupIpcHandlers()
  setupMenu()
  setupAutoUpdater()
  createWindow()
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})
