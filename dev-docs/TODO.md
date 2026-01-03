# TODO

## Code review
- [ ] 096dbf62f9914589555d2496226e0906bcea7223

## Known Issues

- [ ] Medium: `chrome.storage.session` が未対応環境（Firefox等）で `checkPendingRecoveryNotification` が例外になり得るため、feature detection ガードが必要。
- [ ] Low: `recoverFromBackup` がバックアップ内容のV2検証を行わず復旧するため、破損データを再投入する可能性がある。
- [ ] Low: `snoozeLogic.js` L7 に古いコメント (`// Default settings...`) が残っている。削除推奨。
- [ ] Low: 設定が未初期化の時に `getSettings` が `undefined` を返しうるため、Popup側でデフォルトが反映されない可能性がある。

## Refactoring Opportunities

### High Priority (Next Sprint)
- [ ] Medium: 定数の集約管理。`RESTRICTED_PROTOCOLS`, `STORAGE_LIMIT`, `BACKUP_*` 等を `src/utils/constants.js` へ移動。

### Medium Priority (Backlog)
- [ ] Medium: V2スキーマのバージョン定義とマイグレーション表を追加し、検証/修復の入口を単一化。
- [ ] Medium: JSDoc型定義（`SnoozedItemV2`, `ScheduleV2`, `Settings`等）を追加。
- [ ] Medium: `chrome.*` APIラッパー（`ChromeApi.js`）に集約。エラーハンドリング・テストモックを一元化。
- [ ] Medium: メッセージ契約の集約（`action`名とrequest/responseを`messages.js`等に）。
- [ ] Medium: Popupロジックをカスタムフック（`useSnooze.js`）に分離。

### Low Priority (Nice to Have)
- [ ] Low: データフローを`ARCHITECTURE.md`に明示セクション化。
- [ ] Low: エラーハンドリングの統一（ログレベル制御、通知の一元化）。
- [ ] Low: `snooze → restore` の統合テスト追加。
- [ ] Low: `restoreTabs` のネストをフラット化（可読性向上）。
- [ ] Low: `snoozeLogic.js` の分割（スキーマ整理後に実施）。
