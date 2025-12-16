---
description: タスク完了処理 (PR作成、ドキュメント更新)
---

このワークフローは、変更のコミットからプルリクエストの作成までを自動化します。

1. **ドキュメント更新**
   - [ ] `docs/CHANGELOG.md` の [Unreleased] セクションに変更内容を追記。
   - [ ] 重要な教訓があれば `docs/LESSONS.md` に抽出。
   - [ ] アーキテクチャ変更があれば `docs/DECISIONS.md` に ADR を追加。
   - [ ] 設計が変わった場合、`docs/ARCHITECTURE.md` を更新。
   - [ ] 機能追加・変更があった場合、`README.md` を更新。
   - [ ] `docs/LESSONS.md` を整理し、陳腐化した項目をアーカイブまたは削除。

2. **動作確認**
    - [ ] テスト実行。
    // turbo
    pnpm test

3. **コミット & プッシュ**
   - [ ] 現在のブランチ名を確認。
   - [ ] 変更をコミットし、リモートにプッシュする。
   // turbo
   git add . && git commit -m "<type>: <subject>" && git push origin HEAD

4. **プルリクエスト作成**
   - [ ] **注意**: `push` が完全に完了するのを待ってから実行すること。
   - [ ] GitHub CLI で PR を作成する。タイトルと本文は英語で具体的に記述。
   // turbo
   gh pr create --title "feat: Add feature X" --body "Description of changes"