# Expo開発時の注意点：プラットフォーム別の違い

このドキュメントでは、iOS、Android、Webの3プラットフォーム間での主要な違いと開発時の注意点をまとめています。

---

## 📱 プラットフォーム対応早見表

| 機能カテゴリ | iOS | Android | Web | 備考 |
|------------|-----|---------|-----|------|
| **ファイルシステム** | ✅ | ✅ | ⚠️ 制限あり | Webはセキュリティ上の制限が大きい |
| **Bluetooth** | ✅ | ✅ | ❌ | カスタムビルド必須 |
| **GPS/位置情報** | ✅ | ✅ | ⚠️ 限定的 | Webは基本機能のみ |
| **加速度センサー** | ✅ | ✅ | ⚠️ HTTPS必須 | Webは設定が必要 |
| **ジャイロスコープ** | ✅ | ✅ | ⚠️ HTTPS必須 | Webは設定が必要 |
| **気圧計** | ✅ | ✅ | ❌ | |
| **磁力計** | ✅ | ✅ | ❌ | |
| **歩数計** | ✅ | ✅ | ❌ | |
| **光センサー** | ❌ | ✅ | ❌ | Android専用 |
| **カメラ** | ✅ | ✅ | ⚠️ 限定的 | Webは基本機能のみ |
| **通知** | ✅ | ✅ | ⚠️ 限定的 | Webはブラウザ通知 |

---

## 🔧 開発時の重要なポイント

### プラットフォーム分岐の実装方法

Expoでは2つの方法でプラットフォーム別の処理を実装できます：

#### 1. `Platform` モジュールを使用

```javascript
import { Platform } from 'react-native';

if (Platform.OS === 'ios') {
  // iOS専用コード
} else if (Platform.OS === 'android') {
  // Android専用コード
} else if (Platform.OS === 'web') {
  // Web専用コード
}
```

#### 2. プラットフォーム別ファイル

ファイル名に拡張子を追加することで、自動的に適切なファイルが選択されます：

```
MyComponent.ios.js    # iOS用
MyComponent.android.js # Android用
MyComponent.web.js     # Web用
MyComponent.js         # フォールバック（共通）
```

---

## 📁 ファイルシステム (FileSystem)

### iOS

✅ **利用可能な機能**
- 完全なファイル読み書き
- セキュリティスコープリソース対応
- ドキュメントピッカー統合

⚠️ **注意点**
- ディレクトリアクセスは**セッション限定**（アプリ再起動後は再要求が必要）
- iOS Filesアプリとの統合には`app.json`に下記設定が必要：
  ```json
  {
    "expo": {
      "ios": {
        "infoPlist": {
          "UISupportsDocumentBrowser": true,
          "UIFileSharingEnabled": true,
          "LSSupportsOpeningDocumentsInPlace": true
        }
      }
    }
  }
  ```

### Android

✅ **利用可能な機能**
- 完全なファイル読み書き
- Storage Access Framework (SAF) 対応
- Content URI変換 (`file://` → `content://`)

⚠️ **注意点**
- **Android 10以降はScoped Storage**により、システムディレクトリ（Downloadなど）への直接書き込みが制限
- 大容量ファイル処理時はメモリ不足の可能性（`react-native-document-picker`推奨）
- `AndroidManifest.xml`で`largeHeap`フラグを有効化する選択肢あり

### Web

❌ **大幅な制限**
- ブラウザのセキュリティモデルにより、直接のファイルシステムアクセスは**不可**
- `expo-file-system`のほとんどのメソッドが**使用不可**

⚠️ **代替手段**
- ユーザー操作による`<input type="file">`でのファイル選択
- `File`/`Blob` APIを使用
- Web専用ライブラリの利用（例：`dom-to-image`）

**推奨パターン:**
```javascript
if (Platform.OS === 'web') {
  // Webは<input>やBlobを使用
} else {
  // iOS/Androidはexpo-file-systemを使用
}
```

---

## 📡 Bluetooth

### iOS / Android

✅ **利用可能** (BLE: Bluetooth Low Energy)

⚠️ **重要な制限**
- **Expo Goでは動作しません**
- **カスタム開発ビルド（Development Build）が必須**
  ```powershell
  npx expo prebuild
  # または EAS Build使用
  ```
- 物理デバイスが必須（エミュレータ/シミュレータでは**テスト不可**）

**推奨ライブラリ:**
- `react-native-ble-plx`
- `react-native-ble-manager`

**パーミッション設定例 (app.json):**
```json
{
  "expo": {
    "plugins": [
      [
        "react-native-ble-plx",
        {
          "isBackgroundEnabled": true,
          "modes": ["peripheral", "central"],
          "bluetoothAlwaysPermission": "Allow $(PRODUCT_NAME) to connect to bluetooth devices"
        }
      ]
    ]
  }
}
```

**プラットフォーム別の違い:**
- **iOS**: Bluetoothのオン/オフをアプリから操作不可（設定アプリへ誘導のみ）
- **Android**: アプリ内でBluetooth有効化のリクエストが可能

### Web

❌ **Bluetooth未対応**（Web Bluetooth APIは別途検討が必要）

---

## 📍 GPS / 位置情報 (Location)

### iOS / Android

✅ **`expo-location`で完全対応**

**主要機能:**
- 現在地取得
- 位置情報の継続監視
- バックグラウンド位置情報
- ジオフェンシング

**パーミッション設定 (app.json):**
```json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "NSLocationWhenInUseUsageDescription": "アプリ使用中に位置情報を使用します",
        "NSLocationAlwaysAndWhenInUseUsageDescription": "常に位置情報を使用します"
      }
    },
    "android": {
      "permissions": [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "ACCESS_BACKGROUND_LOCATION"
      ]
    }
  }
}
```

⚠️ **プラットフォーム別の注意点**

**iOS:**
- バックグラウンド位置情報には開発ビルドが必要
- アプリ終了後、ジオフェンスイベントで自動再起動される可能性あり

**Android:**
- アプリ終了後は自動再起動されない可能性
- `ACCESS_BACKGROUND_LOCATION`はGoogle Playの審査が必要

### Web

⚠️ **基本機能のみ対応**
- ブラウザの`navigator.geolocation` API経由
- ジオコーディング（住所⇔座標変換）はサーバーサイドAPIで制限あり

---

## 🎯 各種センサー (expo-sensors)

### 対応状況

| センサー | iOS | Android | Web | 備考 |
|---------|-----|---------|-----|------|
| **加速度センサー** | ✅ | ✅ | ⚠️ | Webは`expo start --https`が必要 |
| **ジャイロスコープ** | ✅ | ✅ | ⚠️ | Webは`expo start --https`が必要 |
| **気圧計** | ✅ | ✅ | ❌ | |
| **磁力計** | ✅ | ✅ | ❌ | |
| **歩数計** | ✅ | ✅ | ❌ | |
| **光センサー** | ❌ | ✅ | ❌ | Android専用 |
| **DeviceMotion** | ✅ | ✅ | ⚠️ | Webは`expo start --https`が必要 |

### Web版センサーの使用方法

```powershell
# HTTPSモードで起動（センサーアクセスにHTTPSが必須）
npx expo start --https
```

⚠️ **注意:** Webでは`setUpdateInterval()`が動作しません

---

## 📷 カメラ・メディア

### iOS / Android

✅ **`expo-camera`/`expo-image-picker`で完全対応**
- カメラ撮影
- 写真・動画のピッカー
- バーコード/QRコードスキャン

### Web

⚠️ **限定的な対応**
- 基本的なカメラアクセスは可能（`getUserMedia` API）
- ネイティブアプリと比べて機能が制限される

---

## 🔔 プッシュ通知

### iOS / Android

✅ **`expo-notifications`で完全対応**
- ローカル通知
- プッシュ通知（Expo Push Notification Service経由）

### Web

⚠️ **限定的**
- ブラウザのWeb Push API（サービスワーカー必要）
- ネイティブのようなリッチ通知は期待できない

---

## 🌐 ネットワーク

### 全プラットフォーム対応

✅ すべてのプラットフォームで基本的に同じ挙動

**推奨API:**
- `fetch` (標準Web API)
- `expo/fetch` (Expoラッパー)
- `axios` などのライブラリ

⚠️ **注意点**
- CORSの制限はWeb版でのみ発生
- iOS App Transport Security (ATS) の設定に注意

---

## 💡 開発時の推奨フロー

### 1. 初期開発（最速）
```powershell
npm run web
```
- ブラウザで基本UIとロジックを構築
- ホットリロードで高速開発

### 2. ネイティブ機能の確認
```powershell
npm start
# → Expo GoアプリでQRコードスキャン
```
- センサーや基本APIの動作確認

### 3. 高度な機能開発
```powershell
npx expo prebuild
npx expo run:ios
npx expo run:android
```
- Bluetooth、カスタムネイティブモジュールなど
- 開発ビルド（Development Build）が必要

---

## ⚠️ よくある落とし穴

### 1. Expo Goの制限
- **Bluetooth、カスタムネイティブモジュールは動作しません**
- 開発ビルドまたはEAS Buildが必要

### 2. Webの制限
- ファイルシステム、ほとんどのセンサーが使用不可
- 必ずプラットフォーム分岐を実装

### 3. パーミッション
- iOS/Androidで異なる設定方法
- `app.json`の`plugins`セクションで設定

### 4. エミュレータ/シミュレータの制限
- Bluetoothは物理デバイスでのみテスト可能
- センサーの動作も限定的

---

## 📚 参考リンク

- [Expo Platform-specific code](https://docs.expo.dev/guides/platform-specific-code/)
- [expo-file-system](https://docs.expo.dev/versions/latest/sdk/filesystem/)
- [expo-location](https://docs.expo.dev/versions/latest/sdk/location/)
- [expo-sensors](https://docs.expo.dev/versions/latest/sdk/sensors/)
- [React Native BLE PLX](https://github.com/dotintent/react-native-ble-plx)

---

## ✅ チェックリスト

開発前に確認すべき項目：

- [ ] 使用する機能が全プラットフォームで動作するか確認
- [ ] Web版は制限を理解し、代替手段を用意
- [ ] Bluetooth等の特殊機能は開発ビルドで検証
- [ ] パーミッション設定を`app.json`に追加
- [ ] プラットフォーム分岐のコードを実装
