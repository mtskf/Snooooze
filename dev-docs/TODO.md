# TODO

> [!IMPORTANT]
> **Always keep this list sorted by Priority (High > Medium > Low).**

**Legend**:

- **Priority**: 🚨 High | ⚠️ Medium | 💡 Low
- **Type**: ✨ Feature | 🔧 Refactor | 🐛 Bug | 📦 Infra | 🧪 Test
- **Scope**: [S] Small | [M] Medium | [L] Large

---

## 🤖 AI Agent Infrastructure

> AI自律開発の前提条件。

### 🚨 High

- [ ] 📦 [M] **Validation Scripts + Linting の整備**
  - `npm run type-check` (tsc --noEmit)
  - `npm run lint` (ESLint + Prettier, TypeScript/React対応)
  - `npm run verify` (type-check → lint → test → build)
  - `husky` + `lint-staged` で pre-commit フック

- [ ] 📦 [M] **CI/CD の導入**
  - `.github/workflows/verify.yml`: PR時に `npm run verify` 実行
  - カバレッジ閾値 (lines 80%, branches 70%)、低下時マージブロック

### ⚠️ Medium

- [ ] 📦 [S] **CONTRIBUTING.md の作成** - 開発手順、コマンド集、TDDルール

### 💡 Low

- [ ] 📦 [M] `tools/release.sh` - zip生成、manifest調整、バージョンバンプ自動化
- [ ] 🧪 [M] E2E テスト導入調査 - Playwright等でモックなしテスト

---

## Refactoring & Maintenance

### ⚠️ Medium

#### 🧹 コード統合

- [ ] 🔧 [M] **ストレージ取得の一本化** - `getStorageV2` / `ensureValidStorage` / `getValidatedSnoozedTabs` を統合
- [ ] 🔧 [S] メッセージ送信の一本化 - `messages.ts` に統一、`ChromeApi.sendMessage` を削除

#### 🏗️ ロジック分離

- [ ] 🔧 [M] **`Options.tsx` のロジック分離** - `useSnoozeActions`, `useOptionsState` フックへ
- [ ] 🔧 [M] **`SnoozedList.tsx` のグルーピング分離** - 日付/ウィンドウグループ化をユーティリティへ
- [ ] 🔧 [M] **`Popup.tsx` のロジック分離** - `useSnooze` フック、時間判定を `timeUtils.ts` と共通化
- [ ] 🔧 [L] `snoozeLogic.ts` の分割 - 責務ごとにモジュール化

#### ⚙️ システム改善

- [ ] 🔧 [L] **Functional Core / Imperative Shell** - 純粋ロジックと Chrome I/O を分離、`Date.now()` 依存注入

### 💡 Low

#### 🐛 バグ

- [ ] 🐛 [S] 非同期処理中のアンマウント時 `setState` ガード（`Options`/`Popup`）
- [ ] 🐛 [S] キーボードショートカット無効化対象を拡張（`textarea`/`select`/`contenteditable`）

#### ✨ 機能

- [ ] ✨ [M] インポート時の重複タブデデュープ（キー: `url`+`popTime`）

#### 🧪 テスト

- [ ] 🧪 [M] `timeUtils.ts` エッジケーステスト強化（日付またぎ、DST）
- [ ] 🧪 [M] Reactコンポーネントのa11yレビュー（focus管理、ARIA）

---

### ✅ Done

- [x] 🔧 [L] **TypeScriptへの移行** (PR #103, #107, #108, #109, #110)
- [x] 🔧 [L] **V2一本化の完了** (PR #100, #101, #102)
- [x] 🔧 [M] **ARCHITECTURE.md の強化** (PR #111)
- [x] 🐛 タブ復元失敗時ロジック改善（リトライ、再スケジュール、FailedTabsDialog）
- [x] 🔧 メッセージ契約の作成・接続（`messages.ts`）
- [x] 🔧 Chrome APIラッパー（`ChromeApi.ts`）
- [x] 🐛 V2サニタイズ時のversion保持
- [x] 🐛 schemaVersioningの配列検出
- [x] 🔧 `Options.tsx` 設定書き込みをメッセージ経由に変更
- [x] 🔧 `getSettings` 統合、`timeUtils.ts` エラーハンドリング追加
