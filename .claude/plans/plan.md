# TypeScript移行 実装計画

## 概要

JS + JSDoc から TypeScript への段階的移行。既存の型定義（types.js）を活用し、リスクを最小化しながら移行。

## 現状分析

- **ビルドツール**: Vite 7.3.0 + @vitejs/plugin-react
- **テスト**: Vitest 4.0.16
- **ファイル数**: ソース42 + テスト26 = 68ファイル
- **型定義**: types.js に28個のJSDoc typedef（集約済み）
- **既存の@types**: @types/react, @types/node インストール済み

## 設計方針

- **段階的移行**: `allowJs: true` で共存期間を設け、ファイル単位で移行
- **型定義ファースト**: types.js → types.ts を最初に移行し、他ファイルの移行を容易に
- **TDD準拠**: 各Phaseで以下の順序を厳守:
  1. 対象モジュールのテストファイル (.test.js/.test.jsx) を先に .test.ts/.test.tsx に移行
  2. テストがパスすることを確認
  3. 本体ファイルを移行
  > 注1: テストが存在しないファイルは本体のみ移行。テスト新規作成は移行スコープ外。
  > 注2: Phase 7 は「残りのテストファイル」（setup.js等）のみを対象とする。
- **Chrome API型**: `@types/chrome` を使用し、Promise返却のオーバーロードを拡張d.ts（`src/chrome-promise.d.ts`）で補完
- **PR戦略**: 各Phaseで1PRを作成。Phase 3 のように複数ファイルがある場合は、依存順に2-3ファイルずつチェックポイントコミットを入れつつ1PRにまとめる

---

## Phase 1: インフラ整備

**ブランチ**: `refactor/typescript-setup`

### 作業内容

#### 1-1. 依存関係追加
```bash
pnpm add -D typescript @types/chrome
```

#### 1-2. tsconfig.json 作成
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noEmit": true,
    "allowJs": true,
    "checkJs": false,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "types": ["vite/client", "vitest/globals", "chrome"],
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

> 注: `vitest/globals` を Phase 1 で追加する理由: 既存テストファイル（.test.js）が `allowJs: true` 環境で読み込まれた際に `describe`/`it` 等のグローバルAPIが解決できるようにするため。Phase 7 まで待つと移行中の `tsc --noEmit` で不要なエラーが発生する可能性がある。
> 注: `vitest/globals` は移行中の暫定措置。本来 production code で `describe` 等が型的に通るのは望ましくない。Phase 8 でテスト専用 tsconfig への分離を検討。

#### 1-3. vite.config.js → vite.config.ts
- Vite設定ファイルをTypeScript化し、`defineConfig` の型補完を有効にする
- 既存の `resolve.alias` 設定が tsconfig の `paths` と整合していることを確認
- **`"type": "module"` 追加時は `__dirname` を ESM 互換に置換**:
  ```typescript
  import { fileURLToPath } from 'url';
  import { dirname, resolve } from 'path';

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  ```

#### 1-4. tsconfig.node.json 作成（vite.config.ts用）
```json
{
  "compilerOptions": {
    "composite": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "noEmit": true,
    "skipLibCheck": true,
    "types": ["node"]
  },
  "include": ["vite.config.ts"]
}
```

#### 1-5. package.json の確認
- 現状: `"type": "module"` は**未設定**
- 追加前に以下を確認:
  1. `vite.config.js` が ESM 形式（`export default`）であること
  2. `postcss.config.js`/`tailwind.config.js` が ESM 対応または `.cjs` 拡張子であること
  3. `pnpm dev` / `pnpm build` / `pnpm test` が正常動作すること
- 問題がなければ `"type": "module"` を追加

#### 1-6. Chrome Promise型拡張（src/chrome-promise.d.ts）
`@types/chrome` はコールバック型のため、現コードの Promise 使用（`await chrome.storage.local.get`等）と合わない。Promise返却のオーバーロードを追加。

**対象API**:
- `storage.local` / `storage.session`
- `tabs` (create, remove, query, update)
- `windows` (create, getAll, get, getLastFocused, remove)
- `notifications` (create, clear)
- `alarms` (create, clear, clearAll, get, getAll)
- `runtime` (sendMessage, openOptionsPage)
- `commands` (getAll)

> 注: `runtime.getURL`は同期関数のため`@types/chrome`で対応、d.ts不要。
> 運用: API呼び出しは `ChromeApi` 経由を推奨。イベントリスナー登録や新規直呼びが増えた場合はd.tsに追記。

```typescript
// src/chrome-promise.d.ts
// Promise版のオーバーロードを追加（既存のコールバック版と共存）

declare namespace chrome.storage {
  interface StorageArea {
    get(keys?: string | string[] | null): Promise<{ [key: string]: any }>;
    set(items: { [key: string]: any }): Promise<void>;
    remove(keys: string | string[]): Promise<void>;
    getBytesInUse(keys?: string | string[] | null): Promise<number>;
  }
  const session: StorageArea;
}

declare namespace chrome.tabs {
  function create(createProperties: chrome.tabs.CreateProperties): Promise<chrome.tabs.Tab>;
  function remove(tabIds: number | number[]): Promise<void>;
  function query(queryInfo: chrome.tabs.QueryInfo): Promise<chrome.tabs.Tab[]>;
  function update(tabId: number, updateProperties: chrome.tabs.UpdateProperties): Promise<chrome.tabs.Tab>;
}

declare namespace chrome.windows {
  function create(createData?: chrome.windows.CreateData): Promise<chrome.windows.Window>;
  function getAll(getInfo?: chrome.windows.GetInfo): Promise<chrome.windows.Window[]>;
  function get(windowId: number, getInfo?: chrome.windows.GetInfo): Promise<chrome.windows.Window>;
  function getLastFocused(getInfo?: chrome.windows.GetInfo): Promise<chrome.windows.Window>;
  function remove(windowId: number): Promise<void>;
}

declare namespace chrome.notifications {
  function create(notificationId: string, options: chrome.notifications.NotificationOptions): Promise<string>;
  function clear(notificationId: string): Promise<boolean>;
}

declare namespace chrome.alarms {
  function create(name: string, alarmInfo: chrome.alarms.AlarmCreateInfo): Promise<void>;
  function clear(name?: string): Promise<boolean>;
  function clearAll(): Promise<boolean>;
  function get(name: string): Promise<chrome.alarms.Alarm | undefined>;
  function getAll(): Promise<chrome.alarms.Alarm[]>;
}

declare namespace chrome.runtime {
  function sendMessage<T = any>(message: any): Promise<T>;
  function openOptionsPage(): Promise<void>;
}

declare namespace chrome.commands {
  function getAll(): Promise<chrome.commands.Command[]>;
}
```

> 注: `@types/chrome` は `src/types.ts` と共存可能（node_modules内の型定義のため衝突しない）

**検証必須**: Phase 1 完了時に `tsc --noEmit` で `@types/chrome` との衝突がないか確認すること。
最新の `@types/chrome` は MV3 Promise 対応を含む可能性があるため、重複定義（Duplicate identifier）が発生した場合は `chrome-promise.d.ts` から該当定義を削除するか調整が必要。

### 完了条件
- [ ] 設定ファイル（vite.config, postcss.config, tailwind.config）のESM互換性を確認済み
- [ ] `package.json` に `"type": "module"` が設定されている（または不要と判断）
- [ ] `pnpm tsc --noEmit` がエラーなしで完了
- [ ] `pnpm tsc -p tsconfig.node.json --noEmit` がエラーなしで完了
- [ ] 既存の `pnpm dev` / `pnpm build` / `pnpm test` が全パス

---

## Phase 2: 型定義ファイルの移行

**ブランチ**: `refactor/typescript-types`

### 変更ファイル
- `src/types.js` → `src/types.ts`

### 作業内容

#### 2-1. JSDoc typedef → TypeScript interface/type
```typescript
// Before (JSDoc)
/**
 * @typedef {Object} SnoozedItemV2
 * @property {string} id
 * ...
 */

// After (TypeScript)
export interface SnoozedItemV2 {
  id: string;
  url: string;
  title?: string;
  favicon?: string | null;
  creationTime: number;
  popTime: number;
  groupId?: string | null;
  index?: number;
}
```

#### 2-2. Discriminated Union の活用
```typescript
export interface GetSnoozedTabsV2Request {
  action: 'getSnoozedTabsV2';
}

export interface SetSnoozedTabsRequest {
  action: 'setSnoozedTabs';
  data: StorageV2 | LegacyV1Data;
}

export type MessageRequest =
  | GetSnoozedTabsV2Request
  | SetSnoozedTabsRequest
  | ...;
```

### 完了条件
- [ ] `src/types.ts` が `tsc --noEmit` でエラーなし
- [ ] 全ファイルの `import ... from './types.js'` を `'./types'` に更新（拡張子なし）
- [ ] 他のJSファイルから型インポートが動作
- [ ] `pnpm test` 全パス

---

## Phase 3: ユーティリティ層の移行

**ブランチ**: `refactor/typescript-utils`

### 移行順序（依存関係順）
1. `src/utils/constants.js` → `.ts`
2. `src/utils/uuid.js` → `.ts` (または `crypto.randomUUID()` へ置換)
3. `src/utils/validation.js` → `.ts`
4. `src/utils/selectors.js` → `.ts`
5. `src/utils/timeUtils.js` → `.ts`
6. `src/utils/StorageService.js` → `.ts`
7. `src/utils/ChromeApi.js` → `.ts`
8. `src/utils/settingsHelper.js` → `.ts`
9. `src/lib/utils.js` → `.ts` (shadcn/ui の `cn` ユーティリティ)

> 注: Vite は拡張子を自動解決するため、通常は `.ts` 化で問題なし。万一インポートエラーが出た場合は参照元を優先移行する。

### 作業内容
各ファイルで:
1. `.js` → `.ts` リネーム
2. 参照側の import パスを更新（`.js` 拡張子削除）
3. JSDoc `@param`/`@returns` → TypeScript型注釈
4. 型インポートを `import type { ... }` に変更
5. `tsc --noEmit` でエラー確認・修正

### 完了条件
- [ ] 各ユーティリティの `.test.js` を先に `.test.ts` に移行済み
- [ ] 全ユーティリティが `.ts`
- [ ] `tsc --noEmit` エラーなし
- [ ] `pnpm test` 全パス

---

## Phase 4: メッセージング層の移行

**ブランチ**: `refactor/typescript-messages`

### 変更ファイル
- `src/messages.js` → `.ts`

### 作業内容

#### 4-1. MESSAGE_ACTIONS を const assertion で型安全に
```typescript
export const MESSAGE_ACTIONS = {
  GET_SNOOZED_TABS_V2: 'getSnoozedTabsV2',
  SET_SNOOZED_TABS: 'setSnoozedTabs',
  // ...
} as const;

export type MessageAction = typeof MESSAGE_ACTIONS[keyof typeof MESSAGE_ACTIONS];
```

#### 4-2. Handler型の厳密化
```typescript
type MessageHandler<T extends MessageRequest> = (
  request: T,
  services: Services
) => Promise<MessageResponse>;
```

#### 4-3. 参照側のimportパス更新
- `serviceWorker.js` など `messages.js` を参照するファイルのimportパスを更新

### 完了条件
- [ ] `messages.test.js` を先に `.test.ts` に移行済み
- [ ] `src/messages.ts` が型安全
- [ ] `tsc --noEmit` エラーなし
- [ ] `pnpm test` 全パス

---

## Phase 5: バックグラウンド層の移行

**ブランチ**: `refactor/typescript-background`

### 変更ファイル
- `src/background/snoozeLogic.js` → `.ts`
- `src/background/serviceWorker.js` → `.ts`
- `src/background/schemaVersioning.js` → `.ts`

### 作業内容
1. `.js` → `.ts` リネーム
2. 参照側の import パスを更新
3. **vite.config.ts の `build.rollupOptions.input` パスを `.ts` に更新**
4. **vite.config.ts の `manualChunks` 条件を正規表現に変更**:
   ```typescript
   // Before: id.includes('validation.js') || id.includes('snoozeLogic.js')
   // After:  /(^|[\\/])(validation|snoozeLogic)\.[tj]s$/.test(id)
   ```
5. 型注釈を追加

### 注意点
- `snoozeLogic.js` は最大のファイル（~900行）、慎重に移行
- Chrome API呼び出しの型付け（ChromeApi.tsの型を活用）

### 完了条件
- [ ] `snoozeLogic.test.js`, `schemaVersioning.test.js` 等を先に `.test.ts` に移行済み
- [ ] バックグラウンドファイルが `.ts`
- [ ] `vite.config.ts` のエントリーポイント・manualChunks更新済み
- [ ] `tsc --noEmit` エラーなし
- [ ] `pnpm build` 成功
- [ ] `pnpm test` 全パス

---

## Phase 6: React コンポーネント層の移行

**ブランチ**: `refactor/typescript-react`

### 移行順序
1. `src/popup/main.jsx` → `.tsx`（エントリーポイント）
2. `src/options/main.jsx` → `.tsx`（エントリーポイント）
3. `src/popup/hooks/useKeyboardNavigation.js` → `.ts`
4. `src/popup/components/ScopeSelector.jsx` → `.tsx`
5. `src/popup/components/SnoozeItem.jsx` → `.tsx`
6. `src/popup/Popup.jsx` → `.tsx`
7. `src/options/Options.jsx` → `.tsx`
8. `src/options/SnoozedList.jsx` → `.tsx`
9. `src/options/FailedTabsDialog.jsx` → `.tsx`
10. `src/options/ShortcutEditor.jsx` → `.tsx`
11. `src/options/TimeSettings.jsx` → `.tsx`
12. `src/options/GlobalShortcutSettings.jsx` → `.tsx`
13. `src/options/SnoozeActionSettings.jsx` → `.tsx`
14. `src/options/AppearanceSettings.jsx` → `.tsx`
15. `src/components/ui/*.jsx` → `.tsx`

### 作業内容
1. `.jsx` → `.tsx` リネーム
2. 参照側の import パスを更新
3. **index.html のエントリーポイント参照を `.tsx` に更新**（popup/main.tsx, options/main.tsx）
4. Props型定義を interface で明示
5. イベントハンドラの型付け（React.MouseEvent等）
6. Refの型付け（useRef<HTMLDivElement>等）

### 完了条件
- [ ] 各コンポーネントの `.test.jsx` を先に `.test.tsx` に移行済み
- [ ] 全コンポーネントが `.tsx`
- [ ] エントリーポイント（index.html）の参照更新済み
- [ ] `tsc --noEmit` エラーなし
- [ ] `pnpm build` 成功
- [ ] `pnpm test` 全パス

---

## Phase 7: 残テストファイルの移行

**ブランチ**: `refactor/typescript-tests`

> 注: Phase 2-6 で各モジュールのテストは先行移行済み。Phase 7 はテスト設定ファイルと、Phase 2-6 で対象外だった残りのテストのみを扱う。

### 作業内容
- `src/test/setup.js` → `.ts`（vitest設定ファイル）
- `vite.config.ts` の `test.setupFiles` パスを `.ts` に更新
- 残りの `.test.js` → `.test.ts` / `.test.jsx` → `.test.tsx`（Phase 2-6 で移行漏れがあれば）
- Vitest の型サポート活用

#### 7-1. chromeMock の型付け
```typescript
// setup.ts
const chromeMock = {
  storage: { local: { get: vi.fn(), set: vi.fn() }, ... },
  ...
} as unknown as typeof chrome;
```

#### 7-2. jest-dom matcher 型の有効化
```typescript
// setup.ts
import '@testing-library/jest-dom/vitest';  // Vitest用型拡張
```

### 完了条件
- [ ] `src/test/setup.ts` に移行済み（chromeMock 型付け、jest-dom/vitest インポート）
- [ ] `vite.config.ts` の `setupFiles` パス更新済み
- [ ] 全テストが `.ts`/`.tsx`
- [ ] `tsc --noEmit` エラーなし（テストファイル含む）
- [ ] `pnpm test` 全パス

---

## Phase 8: クリーンアップ

**ブランチ**: `refactor/typescript-cleanup`

### 作業内容
1. `tsconfig.json` の `allowJs: false` に変更
2. 残存する JSDoc コメントの整理（型情報は削除、説明は残す）
3. TODO.md の TypeScript移行タスクを完了に移動
4. 不要な `@ts-ignore` / `@ts-expect-error` の削除
5. **`vitest/globals` をテスト専用 tsconfig に分離を検討**（production code への型漏れ防止）

### 完了条件
- [ ] `allowJs: false` でビルド成功
- [ ] 全テストパス
- [ ] lint通過

---

## 依存関係

```
Phase 1 (インフラ)
    ↓
Phase 2 (型定義)
    ↓
Phase 3 (ユーティリティ) → Phase 4 (メッセージング)
    ↓                          ↓
Phase 5 (バックグラウンド) ←───┘
    ↓
Phase 6 (React)
    ↓
Phase 7 (テスト)
    ↓
Phase 8 (クリーンアップ)
```

---

## リスクと対策

| リスク | 対策 |
|--------|------|
| Chrome API型の不足 | `@types/chrome` を使用し、不足があれば拡張d.tsで補う |
| 大規模ファイル(snoozeLogic)の移行 | 関数単位で段階的に型付け |
| テスト時のモック型付け | vi.fn()のジェネリクス活用 |
| JSXランタイム設定 | tsconfig.json の `jsx: "react-jsx"` で対応 |

---

## レビュー検証履歴

### 対応済み指摘

| 指摘 | 検証結果 | 対応 |
|------|----------|------|
| TDD準拠 - テスト不在時の方針未記載 | 移行計画なのでテスト新規作成はスコープ外 | 注1追加 |
| chrome-promise.d.ts 運用トリガーが曖昧 | ChromeApi経由に集約済み、イベントリスナーは直接登録必須 | 運用ルール明確化 |
| Phase 3 例外ルールが曖昧 | Viteが拡張子解決するため問題なし | 注記簡素化 |
| Phase 7 chromeMock の型エラー | `as unknown as typeof chrome` が必要 | 7-1追加 |
| Phase 7 jest-dom matcher 型 | `@testing-library/jest-dom/vitest` 必要 | 7-2追加 |
| Phase 7 TS化漏れ検知方法未記載 | `tsc --noEmit` を完了条件に追加すべき | 完了条件追加 |
| "type": "module" 時の __dirname | vite.config.js で4箇所使用中、ESM では未定義 | 1-3 に置換手順追加 |
| vitest/globals が production code に漏れる | 移行中は必要、Phase 8 で分離検討 | 注記追加、Phase 8 に項目追加 |

### 対応不要と判断した指摘

| 指摘 | 理由 |
|------|------|
| Phase 5 manualChunks を配列化すべき | 対象は2ファイルのみ。将来増えても正規表現のパイプ区切りで対応可能。配列化は過剰設計。 |
