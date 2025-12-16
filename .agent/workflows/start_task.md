---
description: タスク開始処理 (ブランチ作成、コンテキスト読み込み)
---

新しい機能開発やバグ修正を開始するときは、必ずこのワークフローを実行してトピックブランチを作成します。

1. **ブランチ名の決定**
   - 命名規則: `type/context`
     - Type: `feature`, `fix`, `docs`, `refactor`, `chore`
     - Context: 作業内容を表す短い英語 (例: `link-fix`, `add-test`)
     - 例: `feature/image-optimization`, `fix/broken-link`

2. **安全確認 (Uncommitted Changes)**
   - [ ] コミットされていない変更がないか確認する。変更がある場合は stash するかコミットする。
   // turbo
   git diff --quiet || echo "WARNING: Uncommitted changes detected. Please stash or commit them before proceeding."

3. **最新の main を取得**
   // turbo
   git checkout main && git pull origin main

4. **ブランチの作成と移動**
   - [ ] 決定したブランチ名で作成・移動する。
   // turbo
   git checkout -b <branch_name>

5. **コンテキスト読み込み**
   - [ ] `README.md` を読み込み、プロジェクト概要を把握。
   - [ ] `docs/LESSONS.md` を読み込み、過去の教訓を確認。
   - [ ] `docs/DECISIONS.md` (最新3-5件) で最近の設計決定を確認。