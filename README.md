# TruckStacker

音響会社向けの荷台シミュレーターアプリケーション。トラックの荷台に音響機材を配置し、視覚的に確認できるデスクトップアプリです。

## 概要

TruckStackerは、音響イベントやコンサートの準備段階で、トラックの荷台に機材を効率的に配置するためのシミュレーションツールです。複数の荷台タイプに対応し、様々な音響機材（スピーカー、アンプなど）をドラッグ&ドロップで配置できます。

## 主な機能

- **荷台シミュレーション**: 複数の荷台タイプから選択可能
- **機材配置**: スピーカー、アンプなどの機材を視覚的に配置
- **カテゴリ管理**: 機材をカテゴリごとに分類・管理
- **配置データの保存・読み込み**: 配置パターンを保存して再利用可能
- **データのエクスポート・インポート**: JSON形式でデータのバックアップ・共有
- **印刷機能**: 配置図を印刷して現場で使用可能
- **自動アップデート**: GitHubリリースからの自動更新に対応

## 技術スタック

- **フレームワーク**: Vue 3 + TypeScript
- **UIライブラリ**: Vuetify 3
- **ビルドツール**: Vite
- **デスクトップ**: Electron
- **パッケージング**: electron-builder

## インストール

### リリース版のダウンロード

最新のリリース版は [GitHub Releases](https://github.com/chords-tokyo/truckstacker/releases) からダウンロードできます。

- **macOS**: `truckstacker-Mac-{version}-Installer.dmg` または `.zip`
- **Windows**: `truckstacker-Windows-{version}-Setup.exe`

### 開発環境のセットアップ

```bash
# リポジトリのクローン
git clone https://github.com/chords-tokyo/truckstacker.git
cd truckstacker

# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev
```

## 使用方法

1. **荷台の選択**: 画面上部から荷台1、荷台2を選択します
2. **機材の配置**: 左側のパネルから機材を選択し、荷台エリアにドラッグ&ドロップで配置します
3. **機材の編集**: 配置済み機材をクリックして詳細を編集できます
4. **配置の保存**: 「配置を保存」ボタンで現在の配置を保存します
5. **配置の読み込み**: 「配置を読込」ボタンで保存済みの配置を読み込みます
6. **印刷**: 「印刷」ボタンで配置図を印刷できます

## 開発

### スクリプト

```bash
# 開発サーバーの起動
npm run dev

# 型チェックとビルド
npm run build:bundles

# ローカルビルド（GitHubに公開しない）
npm run build:local

# リリースビルドとGitHubへの公開
npm run release
```

### プロジェクト構成

```
truckstacker/
├── electron/          # Electronメインプロセス
│   ├── main.ts       # メインプロセスエントリーポイント
│   └── preload.ts    # プリロードスクリプト
├── src/              # Vue.jsアプリケーション
│   ├── components/   # Vueコンポーネント
│   ├── types/        # TypeScript型定義
│   └── assets/       # 静的リソース
├── build/            # ビルド設定とリソース
├── dist/             # ビルド出力（フロントエンド）
├── dist-electron/    # ビルド出力（Electron）
└── electron-builder.json5  # Electron Builder設定
```

## リリース

新しいバージョンをリリースする場合:

1. `package.json`の`version`を更新
2. 変更をコミット
3. タグを作成してプッシュ:
   ```bash
   git tag v0.0.X
   git push origin v0.0.X
   ```
4. GitHub Actionsが自動的にビルドとリリースを作成します

## ライセンス

[ここにライセンス情報を記載]

## 貢献

プルリクエストやイシューの報告を歓迎します。バグ報告や機能要望は [GitHub Issues](https://github.com/chords-tokyo/truckstacker/issues) までお願いします。

## 開発者

chords-tokyo
