# デバイス別セットアップガイド

## 前提条件

```powershell
cd d:\localLLM\ChatClient\expo-app
npm install
```

---

## Web での実行

### 手順

```powershell
npm run web
```

ブラウザが自動的に開き、`http://localhost:8081` でアプリが起動します。

### 要件
- モダンブラウザ（Chrome、Firefox、Safari、Edge）

---

## Android での実行

### オプション1: 実機で実行（推奨）

1. **Expo Goアプリをインストール**
   - [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent) から「Expo Go」をインストール

2. **開発サーバーを起動**
   ```powershell
   npm start
   ```

3. **QRコードをスキャン**
   - ターミナルに表示されるQRコードをスマホでスキャン
   - Androidの場合、Expo Goアプリ内のスキャナーを使用

### オプション2: Androidエミュレータで実行

1. **Android Studioをインストール**
   - [Android Studio](https://developer.android.com/studio) をダウンロード
   
2. **AVDを作成**
   - Android Studio → Tools → AVD Manager → Create Virtual Device

3. **エミュレータでアプリを起動**
   ```powershell
   npm run android
   ```

### 要件
- **実機**: Android 5.0以上
- **エミュレータ**: Android Studio + 8GB以上のRAM推奨

---

## iOS での実行

### オプション1: 実機で実行（推奨）

1. **Expo Goアプリをインストール**
   - [App Store](https://apps.apple.com/app/expo-go/id982107779) から「Expo Go」をインストール

2. **開発サーバーを起動**
   ```powershell
   npm start
   ```

3. **QRコードをスキャン**
   - iPhoneのカメラアプリでQRコードをスキャン
   - 通知をタップしてExpo Goで開く

### オプション2: iOSシミュレータで実行（Macのみ）

1. **Xcodeをインストール**
   - Mac App StoreからXcodeをインストール

2. **シミュレータでアプリを起動**
   ```bash
   npm run ios
   ```

### 要件
- **実機**: iOS 13.0以上
- **シミュレータ**: macOS + Xcode

---

## トラブルシューティング

### ポートが既に使用されている場合

```powershell
# 別のポートで起動
npx expo start --port 8082
```

### キャッシュをクリアして起動

```powershell
npx expo start --clear
```

### 実機が開発サーバーに接続できない場合

- PCとスマホが同じWi-Fiネットワークに接続されているか確認
- ファイアウォールがポート19000-19001をブロックしていないか確認
- トンネル接続を試す: `npx expo start --tunnel`

---

## 推奨開発環境

**最も簡単な方法（初心者向け）:**
1. Web開発: `npm run web`
2. 実機テスト: Expo Goアプリ + QRコード

**本格的な開発（経験者向け）:**
- Android: Android Studio + エミュレータ
- iOS: Mac + Xcode + シミュレータ
