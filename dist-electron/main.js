import { app as a, BrowserWindow as d, ipcMain as n, dialog as i, Menu as c } from "electron";
import { fileURLToPath as w } from "node:url";
import t from "node:path";
import u from "node:fs/promises";
const p = t.dirname(w(import.meta.url));
process.env.APP_ROOT = t.join(p, "..");
const s = process.env.VITE_DEV_SERVER_URL, I = t.join(process.env.APP_ROOT, "dist-electron"), m = t.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = s ? t.join(process.env.APP_ROOT, "public") : m;
let e;
function h() {
  n.handle("read-file", async (r, o) => {
    try {
      return { success: !0, data: await u.readFile(o, "utf-8") };
    } catch (l) {
      return { success: !1, error: l.message };
    }
  }), n.handle("write-file", async (r, o, l) => {
    try {
      return await u.writeFile(o, l, "utf-8"), { success: !0 };
    } catch (f) {
      return { success: !1, error: f.message };
    }
  }), n.handle("show-open-dialog", async (r, o) => e ? await i.showOpenDialog(e, o) : { canceled: !0 }), n.handle("show-save-dialog", async (r, o) => e ? await i.showSaveDialog(e, o) : { canceled: !0 });
}
function _() {
  const r = [
    {
      label: "ファイル",
      submenu: [
        {
          label: "データをエクスポート",
          click: () => {
            e == null || e.webContents.send("menu-export-data");
          }
        },
        {
          label: "データをインポート",
          click: () => {
            e == null || e.webContents.send("menu-import-data");
          }
        },
        { type: "separator" },
        { role: "quit", label: "終了" }
      ]
    },
    {
      label: "編集",
      submenu: [
        { role: "undo", label: "元に戻す" },
        { role: "redo", label: "やり直す" },
        { type: "separator" },
        { role: "cut", label: "切り取り" },
        { role: "copy", label: "コピー" },
        { role: "paste", label: "貼り付け" }
      ]
    },
    {
      label: "表示",
      submenu: [
        { role: "reload", label: "再読み込み" },
        { role: "forceReload", label: "強制再読み込み" },
        { role: "toggleDevTools", label: "開発者ツール" },
        { type: "separator" },
        { role: "resetZoom", label: "ズームをリセット" },
        { role: "zoomIn", label: "拡大" },
        { role: "zoomOut", label: "縮小" },
        { type: "separator" },
        { role: "togglefullscreen", label: "フルスクリーン切替" }
      ]
    }
  ], o = c.buildFromTemplate(r);
  c.setApplicationMenu(o);
}
function b() {
  e = new d({
    width: 1200,
    height: 800,
    icon: t.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      preload: t.join(p, "preload.mjs"),
      contextIsolation: !0,
      nodeIntegration: !1
    }
  }), e.webContents.on("did-finish-load", () => {
    e == null || e.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  }), s ? e.loadURL(s) : e.loadFile(t.join(m, "index.html"));
}
a.whenReady().then(() => {
  h(), _(), b();
});
a.on("window-all-closed", () => {
  process.platform !== "darwin" && (a.quit(), e = null);
});
a.on("activate", () => {
  d.getAllWindows().length === 0 && b();
});
export {
  I as MAIN_DIST,
  m as RENDERER_DIST,
  s as VITE_DEV_SERVER_URL
};
