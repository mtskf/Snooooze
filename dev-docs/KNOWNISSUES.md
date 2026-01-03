# Known Issues


- High: 復元後のストレージ更新が mutex にチェーンされていないため、復元中に他の保存が走ると上書きレースが起き得ます。restoreTabs は storageLock.then で待つだけで、更新処理を storageLock に繋いでいません。snoozeLogic.js (lines 626-663)

- Medium: グループ復元が “一部だけ開けた場合” を検知していないため、chrome.windows.create が部分的に失敗した時に未復元タブが削除され得ます。snoozeLogic.js (lines 586-598)






## tabが消失するリスク
指定した複数URLのうち一部が消失する可能性がある。
現在の実装では、タブを復元すると成功したことにして全タブをストレージから削除してしまうので、開けなかったタブが消失します。

例:

10個URLを渡す
うち2個が chrome:// やブロックされるURLで開けない
それでも windows.create が成功扱いになると、全10個を削除
→ 結果、2個が消える

確認した限り、chrome:// を弾く処理は現行コードにありません。
rg で chrome:// / about: などのフィルタを探しましたが、該当なしです。
Popup.jsx の chrome.tabs.query から、そのまま snooze に渡しているだけです。

つまり現状は：

chrome:// タブも スヌーズ対象になり得る
復元時に chrome.tabs.create が 作成拒否する可能性がある
**「ブロックされるURL」**の例:

chrome:// / edge:// / brave:// などの内部ページ
chrome-extension://（他拡張のページは基本開けない）
about: 系（Firefox内部ページ）
file://（拡張に明示許可がないと開けないことがある）
これらは chrome.tabs.create に渡しても失敗することがあるので、
「グループ復元で成功扱いにすると消失する可能性」がある、という指摘でした。

もし「chrome:// はそもそも除外する」方針なら、
スヌーズ時にURLフィルタを入れるのが安全です。
