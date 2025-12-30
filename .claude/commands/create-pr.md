---
description: Create pull request on GitHub
allowed-tools: Bash(git:*), Bash(gh:*)
---

## Context
- Current git status: !`git status`
- Changes: !`git diff main...HEAD`
- Commits: !`git log --oneline main..HEAD`
- PR template: @.github/pull_request_template.md

## Your task
1. 変更内容とテンプレートをもとに、適切な PR タイトルと本文を日本語で作成する。
2. `git push -u origin <current_branch>` を実行してブランチをリモートに push する。
3. `gh pr create --draft --title "<生成したタイトル>" --body "<生成した本文>"` を実行して Draft PR を作成する。
4. すでに PR が存在する場合は、本文のみを更新する。
