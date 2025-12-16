---
description: リリース処理 (バージョン上げ、タグ打ち、GitHub Release作成)
---

プロジェクトのリリースを行うためのワークフローです。ユーザーから「リリースして」「バージョンを上げて」と指示されたら実行します。

1.  **バージョンの決定**
    - ユーザーに確認するか、変更内容から判断する。
    - `patch`: バグ修正、ドキュメント修正
    - `minor`: 新機能追加
    - `major`: 破壊的変更

2.  **`package.json` の更新とタグ付け**
    - [ ] `npm version` コマンドを実行する。
    // turbo
    pnpm version <type> -m "Release: v%s"

3.  **リモートへのプッシュ**
    - [ ] コミットとタグを同時にプッシュする。
    // turbo
    git push origin main --follow-tags

4.  **GitHub Release の作成**
    - [ ] プッシュしたタグに基づいてリリースノートを自動生成し、公開する。
    // turbo
    gh release create v<new_version> --generate-notes
