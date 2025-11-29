# ExpoChatApp - AI Chat Application

OpenAI互換APIを持つLLMプロバイダーと接続できる、クロスプラットフォーム対応のAIチャットアプリケーション

[![GitHub](https://img.shields.io/badge/GitHub-ExpoChatApp-blue)](https://github.com/t2k2pp/ExpoChatApp)

## 🎯 プロジェクト概要

ファクトリパターンを活用し、複数のAIプロバイダーをシームレスに切り替え可能な設計のチャットアプリケーションです。

**対応プラットフォーム:**
- ✅ Android
- ✅ iOS
- 🔄 Web（開発中 - [TODO.md](TODO.md)参照）

**対応AIプロバイダー:**
- ✅ Llama.cpp
- ✅ Ollama
- ✅ LM Studio
- ✅ OpenAI
- ✅ その他OpenAI互換API
- 🔄 Claude, Gemini, Azure OpenAI（計画中）

## 🚀 クイックスタート

### 前提条件

- Node.js 18以上
- npm または yarn
- Android Studio（Androidビルド用）
- Xcode（iOSビルド用、Macのみ）

### インストール

```bash
cd expo-app
npm install
```

### Android実機での実行

```bash
# Development Buildの作成とインストール
npx expo run:android
```

### iOS実機での実行（Macのみ）

```bash
npx expo run:ios
```

## 📱 使い方

### 1. AIプロバイダーの設定

アプリ起動後、設定画面で以下を入力：

- **Base URL**: `http://192.168.1.24:11434/v1`
- **API Key**: （任意、必要な場合のみ）
- **Model**: 使用するモデル名（例: `llama-3`）
- **Temperature**: `0.7`（0-2の範囲）

### 2. 接続テスト

「Test Connection」ボタンで接続を確認してから「Save Settings」

### 3. チャット開始

- 「+」ボタンで新規チャット作成
- メッセージを入力して送信
- リアルタイムストリーミングレスポンスを受信

## 🏗️ アーキテクチャ

### レイヤー構造

```
┌─────────────────────────────────┐
│         UI Layer                │  Screens, Components
├─────────────────────────────────┤
│      Business Logic Layer       │  ChatService
├─────────────────────────────────┤
│       Provider Layer            │  AIProviderFactory (Factory Pattern)
├─────────────────────────────────┤
│       Storage Layer             │  SQLite + AsyncStorage
└─────────────────────────────────┘
```

### デザインパターン

- **ファクトリパターン**: AIプロバイダーの動的生成
- **シングルトンパターン**: サービスクラスの一元管理
- **レイヤードアーキテクチャ**: 明確な責務分離

詳細: [implementation_plan.md](.gemini/antigravity/brain/*/implementation_plan.md)

## ✨ 実装済み機能

### コア機能
- ✅ リアルタイムストリーミングチャット
- ✅ チャット履歴の永続化（SQLite）
- ✅ チャット検索（タイトル・内容）
- ✅ 新規チャット作成・削除
- ✅ 自動タイトル生成

### 設定機能
- ✅ システムプロンプトのカスタマイズ
- ✅ AIプロバイダー設定
- ✅ 接続テスト機能

### 技術機能
- ✅ OpenAI互換APIサポート
- ✅ ストリーミングレスポンス対応
- ✅ TypeScript完全対応
- ✅ React Navigation統合

## 📋 今後の実装

詳細な実装計画は [TODO.md](TODO.md) を参照

**優先度：高**
- Web版対応（ストレージ抽象化）
- Claude API対応
- Gemini API対応

**優先度：中**
- チャット履歴エクスポート
- ダーク/ライトモード
- 画像送信対応（Vision API）

**優先度：低**
- MCP (Model Context Protocol)
- Canvas/Artifact機能
- Skills、サブエージェント等

## 📂 プロジェクト構造

```
expo-app/
├── src/
│   ├── models/          # 型定義
│   ├── providers/       # AIプロバイダー（Factory Pattern）
│   ├── services/        # ビジネスロジック
│   ├── components/      # 再利用可能UIコンポーネント
│   ├── screens/         # 画面
│   ├── navigation/      # React Navigation設定
│   └── utils/           # ユーティリティ
├── App.js              # エントリーポイント
├── SETUP.md            # 詳細セットアップガイド
├── DevTips.md          # プラットフォーム別開発Tips
├── TODO.md             # 実装予定機能
└── README.md           # このファイル
```

## 🛠️ 開発

### ファイル分割ポリシー

- **1ファイル1000行以下**を厳守
- 責務の明確な分離
- モジュール性重視

### コーディング規約

- TypeScript strict mode
- ESLintに準拠
- コメントは日本語・英語併記

### テスト

```bash
# 型チェック
npx tsc --noEmit

# Lintチェック
npx expo lint
```

## 📖 ドキュメント

- [SETUP.md](SETUP.md) - セットアップガイド
- [DevTips.md](DevTips.md) - プラットフォーム別Tips
- [TODO.md](TODO.md) - 実装予定機能
- [implementation_plan.md](.gemini/antigravity/brain/*/implementation_plan.md) - 詳細設計

## 🤝 コントリビューション

現在は個人プロジェクトですが、フィードバックや提案は歓迎します。

## 📝 ライセンス

Private

## 🔗 関連リンク

- [Expo公式ドキュメント](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)
- [Llama.cpp](https://github.com/ggerganov/llama.cpp)

---

**Last Updated**: 2025-11-30
