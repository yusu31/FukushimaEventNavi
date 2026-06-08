# 福島イベントナビ プロジェクト ガイドライン

## ユーザー情報

- エンジニア未経験（プログラミングスクール RaiseTech 在籍中）
- OS: Windows 11 / エディタ: Cursor（Claude Code拡張入り）
- 前回課題：Trello風タスク管理アプリ（Spring Boot + React + PostgreSQL）を完成済み
- 今回はスクールの最終課題として、前回と異なる技術スタックで新しいアプリを作る

## 応答・説明スタイル（厳守）

- **すべての応答・コメント・説明は日本語で行うこと**
- 操作・コマンドを伝えるときは「裏で何が起きているか」を平易な言葉で必ず説明する
- 専門用語には必ず平易な補足をつける
- 「なぜそうするのか」の理由を省かない
- 手順は番号付きで一つずつ示す
- 端的な回答だけでなく、背景・理由・手順をセットで伝える

## プロジェクト概要

**アプリ名:** 福島イベントナビ（仮）  
**概要:** 福島県内（郡山市・本宮市・いわき市など）のイベント情報を自動集約し、
地域住民や観光客が「今ここで何が起きているか」をひと目で把握できる地域密着型Webアプリ

## 技術スタック

| 役割 | 技術 |
|------|------|
| フロントエンド | Next.js + TypeScript（App Router） |
| バックエンド | Ruby on Rails（APIモード） |
| データベース | MySQL（Docker） |
| 認証 | Devise（Rails gem） |
| 外部API | Connpass API（イベント自動取得） |
| カレンダー表示 | FullCalendar |
| デプロイ | AWS EC2 + RDS |

## MVP機能（最優先）

1. イベントCRUD（登録・一覧・詳細・編集・削除）
2. Connpass APIから福島関連イベントを自動取得・保存
3. 地域・カテゴリ・日付での絞り込み検索
4. カレンダー表示
5. ユーザー認証（ログイン・サインアップ）
6. お気に入り機能（ログイン後）

## サーバー起動・ポート管理（厳守）

### 使用ポート

| サーバー | ポート | 変更可否 |
|----------|--------|--------|
| バックエンド（Rails） | **8080** | 禁止 |
| フロントエンド（Next.js） | **3000** | 禁止 |
| データベース（MySQL） | **3306** | 禁止 |

### 禁止事項

- **別ポートでの代替起動は絶対に行わない**（例: 8081, 3001 など）
- ポートを変更するためにアプリの設定ファイルを書き換えることも禁止
- 理由: Next.jsのAPIプロキシ設定・CORS設定が特定ポートを前提としており、別ポートでは正常動作しない

### ポート競合時の対応手順

```powershell
# 1. ポート使用状況の確認（例: 8080番ポートを確認する場合）
netstat -ano | findstr :8080

# 2. 競合プロセスの停止（PIDを確認してから実行）
taskkill /PID <PID> /F

# 3. 確認後、指定ポートで起動する
```

### 起動手順

```powershell
# 1. DockerでMySQLを起動
docker-compose up -d

# 2. バックエンドを起動（ポート8080）
cd backend
bundle exec rails s -p 8080

# 3. フロントエンドを起動（別ターミナル、ポート3000）
cd frontend
npm run dev
```

## ディレクトリ構成（予定）

```
FukushimaEventNavi/
├── backend/        # Ruby on Rails（APIモード）
├── frontend/       # Next.js + TypeScript
├── docs/           # 要件定義・設計ドキュメント
├── docker-compose.yml
└── CLAUDE.md
```

## GitHubワークフロー（厳守）

- **作業前に必ずIssueを作成する**
- ブランチ命名: `{type}/{説明}-#{Issue番号}`
- コミットメッセージ: `{type}: {日本語説明}`
- **mainへの直接プッシュ禁止**
- **PRなしでmainにマージ禁止**
- PRマージはユーザーの確認後に行う

### ブランチ命名の具体例

- `feature/event-crud-#3`
- `feature/connpass-api-#7`
- `feature/calendar-view-#10`
- `fix/search-filter-not-working-#15`
- `chore/setup-docker-#1`
- `docs/add-api-design-#5`

## 品質チェック

### ルール

- 品質チェック作業はすべて **1つのIssue + 1つのPR** でまとめて対応すること

### フロントエンド

```powershell
cd frontend
npm run lint
# → 0 errors, 0 warnings を確認
```

| 確認観点 | 内容 |
|---|---|
| `react-hooks/exhaustive-deps` | `useEffect` の依存配列に漏れがないか |
| `react/jsx-key` | `.map()` 内の要素に `key` があるか |
| 型安全性 | `any` 型を使っていないか |
| ESLint プラグイン | `eslint-plugin-react` が設定ファイルで有効になっているか |

### バックエンド

```powershell
cd backend
bundle exec rubocop
bundle exec rspec
# → 0 offenses / すべてのテストがパスすることを確認
```

| 確認観点 | 内容 |
|---|---|
| RuboCop | コーディング規約違反がないか |
| N+1 問題 | アソシエーション取得時に `includes` / `eager_load` を使っているか |
| 例外ハンドリング | `rescue_from` でエラーレスポンスを統一処理しているか |
| ストロングパラメータ | `permit` で許可するパラメータを明示しているか |

### ドキュメント整合性

> **ドキュメントは実装を「正」として修正する。ドキュメントに合わせて実装を変えない。**

| ファイル | 確認観点 |
|---|---|
| `docs/requirements.md` | 技術スタック・MVP機能が実装と一致しているか |
| `docs/design.md` | ER図・APIエンドポイントが実装と一致しているか |
| `docs/database-design.md` | テーブル設計が実際のモデルと一致しているか |

## 注意事項

- Webスクレイピングは使用しない（法的リスクのため）
- 外部データ取得はConnpass公式APIのみ使用する
- ドキュメントは実装を「正」として修正する（ドキュメントに合わせて実装を変えない）
