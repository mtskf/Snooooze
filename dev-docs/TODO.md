# TODO

## Known Issues

None currently tracked.

## Refactoring Opportunities

### High Priority (Next Sprint)
- [x] Medium: 定数の集約管理。 ✅
    - `snoozeLogic.js` の `BACKUP_*`, `STORAGE_LIMIT` 等。
    - `src/utils/constants.js` へ移動し、設定の単一情報源とする。

### Medium Priority (Backlog)
- [ ] Medium: ロジックの分離と共通化。
    - `Popup.jsx` の `parseTimeHour` を `timeUtils.js` へ移動。
    - `Popup` ロジックを `useSnooze` フックへ分離。
- [ ] Low: 設定取得の経路を統一（Popup/Optionsともに背景API経由でデフォルトをマージした設定を受け取る）。
- [ ] Medium: V2スキーマのバージョン定義とマイグレーション表を追加し、検証/修復の入口を単一化。
- [ ] Medium: JSDoc型定義（`SnoozedItemV2`, `ScheduleV2`, `Settings`等）を追加。
- [ ] Medium: `chrome.*` APIラッパー（`ChromeApi.js`）に集約。エラーハンドリング・テストモックを一元化。

### Low Priority (Nice to Have)
- [ ] Low: メッセージ契約の集約（`action`名とrequest/responseを`messages.js`等に）。
- [ ] Low: データフローを`ARCHITECTURE.md`に明示セクション化。
- [ ] Low: エラーハンドリングの統一（ログレベル制御、通知の一元化）。
- [ ] Low: `snoozeLogic.js` の分割（スキーマ整理後に実施）。
