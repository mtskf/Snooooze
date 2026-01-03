# TODO

## Priority
- 🚨: Critical / blocks release
- 🟡: Important / should fix soon
- 🟢: Nice to have / cleanup

## Refactoring & Maintenance

### 🟡 Important
1. [ ] メッセージ契約の集約（`messages.js` 等に `action`/request/response を定義）。
2. [ ] `chrome.*` APIラッパー（`ChromeApi.js`）に集約。エラーハンドリング・テストモックを一元化。
3. [ ] ロジックの分離と共通化。
   - `Popup` ロジックを `useSnooze` フックへ分離。
   - `timeUtils.getSettings()` を直接storage読取から排除し、呼び出し元から設定を注入する。
4. [ ] `snoozeLogic.js`のタブ復元失敗時、リトライを繰り返すのではなく、ユーザーが手動で確認できる隔離リストに移動する。
5. [ ] Reactコンポーネント（`Popup.jsx`, `Options.jsx`, `SnoozedList.jsx`）のパフォーマンス/アクセシビリティ/ベストプラクティスを、具体的観点（再レンダリングの原因、focus管理、ARIA）でレビューする。
6. [ ] ユーティリティ（`timeUtils.js`, `uuid.js`）の改善余地を観点ベースでレビューする（API表面、境界値、テスト欠落）。

### 🟢 Nice to Have
1. [ ] データフローを`ARCHITECTURE.md`に明示セクション化。
2. [ ] エラーハンドリングの統一（ログレベル制御、通知の一元化）※`ChromeApi`導入後に実施。
3. [ ] `snoozeLogic.js` の分割（スキーマ整理後に実施）。
4. [ ] 未使用importの整理（Options/Popupなど）。
5. [ ] `serviceWorker.js`の`clearAllSnoozedTabs`アクションで、専用の`clearAll`メッセージハンドラを使い、V2ストアを直接クリアするようリファクタリングする。

### Done
1. [x] JSDoc型定義（`SnoozedItemV2`, `ScheduleV2`, `Settings`等）を追加。
