# TODO

## Code review
- [x] 43d70666ca6b4fb77efa69b1f34203f0251c6d3b
- [ ] 97d1e0d7c45a1d98dce785238b0c180842484aaf


## Known Issues

- [ ] High: Options/Popupが`chrome.storage.local.snoozedTabs`（V1）を直接参照しており、V2移行後は実データ(`snoooze_v2`)とUIが同期しない。Snoozed一覧の表示、検索、更新が実態とズレる。
- [ ] High: インポート処理がV1データのみを基準にマージして`setSnoozedTabs`へ送るため、V2のみ存在する現行データが上書き消失する可能性がある（`snoozedTabs`が空の環境でのデータロス）。
- [ ] Medium: 破損時の復旧フローが実行されない。`recoverFromBackup`は未使用で、`pendingRecoveryNotification`もセットされないため、自動復旧/通知が発火しない。
- [ ] Medium: V2読み取り時の検証・サニタイズが未実装。`getValidatedSnoozedTabs`は未使用で、破損データがそのままUI/ロジックに流れる可能性がある。

## Refactoring Opportunities

- [ ] Medium: ストレージスキーマのマイグレーション整理。`snoooze_v2` のバージョン定義とマイグレーション表を追加し、検証/修復の入口を単一化して分散した補正ロジックを減らす。
- [ ] Medium: V2データモデルのJSDoc型定義と不変条件を明文化（`SnoozedItemV2`/`ScheduleV2`/`Settings`等）。スキーマ整理後に実施し、AI/人間の読み取り精度を上げる。
- [ ] Medium: `chrome.*` 直接アクセスの集約。`chrome.storage` / `chrome.tabs` / `chrome.alarms` を小さなAPIラッパー（例: `ChromeApi.js`）に集約し、エラーハンドリング・デフォルト値・テストモックを一元化する。
- [ ] Medium: メッセージ契約の集約。`action`名とrequest/responseの形を`messages.js`等に集約し、Popup/Options/Background間のコンテキストを一箇所で把握できるようにする。
- [ ] Medium: 定数の集約管理。`RESTRICTED_PROTOCOLS` や `STORAGE_LIMIT` などが散在しています。`src/utils/constants.js` に移動し、再利用性とメンテナンス性を向上させるべきです。
- [ ] Medium: Popupロジックの分離。`Popup.jsx` 内にあるスヌーズ実行やデータ取得ロジックをカスタムフック (`useSnooze.js` 等) に切り出し、ViewとLogicを分離することでテスト容易性を向上させます。
- [ ] Low: データフローの簡易ドキュメント化。`storage → background → UI`の流れ、スキーマの単一真実、主要ユースケースを`dev-docs/ARCHITECTURE.md`等にまとめ、AIのコンテキスト読み込みを軽くする。
- [ ] Low: エラーハンドリングの統一。`console.warn` / `error` の使い分けや、ユーザーへの通知（`chrome.notifications`）の仕組みを一箇所にまとめ、ログ出力レベルを制御できるようにします。
- [ ] Low: UIからドメインロジックを剥離。Popup/Optionsは背景へメッセージを送るだけにして、実処理はbackgroundに集約（UIからの複雑な状態更新を減らす）。
- [ ] Low: 重要フローの小さな統合テスト。`snooze → restore` の一連をChrome APIスタブで確認するテストを追加し、回帰バグを早期検知する。
- [ ] Low: `restoreTabs` のフラット化。ネストが深く（ループ内ループ内非同期処理）、可読性が低いです。上記「復元処理の統合」で不要になる可能性が高いです。
- [ ] Low: `snoozeLogic.js` の分割は優先度を下げる。ストレージ刷新と書き込み経路の一本化が先に必要で、今やると二度手間になりやすい。

## Doc updates

SPEC.md, ARCHITECTURE.md, DECISIONS.md, LESSONS.md, CHANGELOG.mdに以下のコミットの内容を反映させて：
- [x] 97d1e0d7c45a1d98dce785238b0c180842484aaf
