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

  // ログを有効化（デバッグ用）
  // electron-logがインストールされている場合は、以下のコメントを外してください
  // autoUpdater.logger = require('electron-log')
  // autoUpdater.logger.transports.file.level = 'info'

  // 自動ダウンロードを有効化
  autoUpdater.autoDownload = true
  // アプリ終了時に自動インストール
  autoUpdater.autoInstallOnAppQuit = true

  // 初回チェック（アプリ起動時）
  autoUpdater.checkForUpdatesAndNotify().catch((err) => {
    console.error('アップデートチェックに失敗しました:', err)
  })

  // 定期的にチェック（1時間ごと）
  setInterval(() => {
    autoUpdater.checkForUpdatesAndNotify().catch((err) => {
      console.error('定期アップデートチェックに失敗しました:', err)
    })
  }, 60 * 60 * 1000) // 1時間ごと

  // イベントハンドラー
  autoUpdater.on('checking-for-update', () => {
    console.log('アップデートをチェック中...')
  })

  autoUpdater.on('update-available', (info) => {
    console.log('アップデートが利用可能です:', info.version)
    if (win) {
      win.webContents.send('update-available', info)
    }
  })

  autoUpdater.on('update-not-available', (info) => {
    console.log('アップデートはありません。最新版です:', info.version)
  })

  autoUpdater.on('error', (err) => {
    console.error('アップデートエラー:', err)
    console.error('エラー詳細:', {
      message: err.message,
      stack: err.stack,
      code: (err as any).code,
      errno: (err as any).errno
    })
    if (win) {
      win.webContents.send('update-error', err.message || '不明なエラーが発生しました')
    }
  })

  autoUpdater.on('download-progress', (progressObj) => {
    const message = `ダウンロード中: ${Math.round(progressObj.percent)}%`
    console.log(message)
    if (win) {
      win.webContents.send('update-download-progress', progressObj)
    }
  })

  autoUpdater.on('update-downloaded', (info) => {
    console.log('アップデートのダウンロードが完了しました:', info.version)
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
          autoUpdater.quitAndInstall(false, true)
        }
      })
    }
  })
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
