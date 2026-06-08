# 設計書（API・システム構成）

## システム構成

```
ブラウザ
  │
  ▼
Next.js（フロントエンド） :3000
  │  JSON（HTTP API 通信）
  ▼
Ruby on Rails（バックエンド API） :8080
  │  SQL
  ▼
MySQL（データベース） :3306（Docker）
```

---

## API エンドポイント一覧

すべてのエンドポイントは `/api/v1/` プレフィックスを付ける。

### 認証（Devise）

| メソッド | パス | 説明 | 認証 |
|---------|------|------|------|
| POST | `/api/v1/auth` | サインアップ（新規ユーザー登録） | 不要 |
| POST | `/api/v1/auth/sign_in` | ログイン | 不要 |
| DELETE | `/api/v1/auth/sign_out` | ログアウト | 必要 |
| GET | `/api/v1/auth/validate_token` | トークン有効性確認 | 必要 |

### イベント

イベントは Connpass API から自動取得するのみ。手動登録・更新・削除はない。

| メソッド | パス | 説明 | 認証 |
|---------|------|------|------|
| GET | `/api/v1/events` | イベント一覧取得（絞り込み・ソート対応） | 不要 |
| GET | `/api/v1/events/:id` | イベント詳細取得 | 不要 |

#### GET /api/v1/events クエリパラメータ

| パラメータ | 型 | 説明 | 例 |
|-----------|-----|------|-----|
| area | string | 地域で絞り込み | `?area=koriyama` |
| category | string | カテゴリで絞り込み | `?category=it` |
| start_date | date | この日以降のイベントを取得 | `?start_date=2026-06-01` |
| end_date | date | この日以前のイベントを取得 | `?end_date=2026-06-30` |
| sort | string | ソート順（`newest` / `start_asc`）デフォルト: `start_asc` | `?sort=newest` |
| page | integer | ページ番号（ページネーション） | `?page=2` |

#### レスポンス例（GET /api/v1/events）

```json
{
  "events": [
    {
      "id": 1,
      "title": "福島Ruby勉強会",
      "description": "Rubyについて話し合う勉強会です",
      "location": "郡山市 ビッグパレットふくしま",
      "area": "koriyama",
      "category": "it",
      "start_at": "2026-06-15T14:00:00+09:00",
      "end_at": "2026-06-15T17:00:00+09:00",
      "event_url": "https://connpass.com/event/123456/",
      "image_url": "https://connpass.com/event/123456/image.png",
      "source": "connpass"
    }
  ],
  "meta": {
    "total_count": 42,
    "current_page": 1,
    "total_pages": 5
  }
}
```

### スケジュール（カレンダー予定管理）

ログインユーザーが「カレンダーに追加」したイベントを管理する（F-04）。

| メソッド | パス | 説明 | 認証 |
|---------|------|------|------|
| GET | `/api/v1/schedules` | 自分のスケジュール一覧取得 | 必要 |
| POST | `/api/v1/schedules` | イベントをスケジュールに追加 | 必要 |
| DELETE | `/api/v1/schedules/:event_id` | スケジュールから削除 | 必要 |

### お気に入り

| メソッド | パス | 説明 | 認証 |
|---------|------|------|------|
| GET | `/api/v1/favorites` | お気に入り一覧取得 | 必要 |
| POST | `/api/v1/favorites` | お気に入りに追加 | 必要 |
| DELETE | `/api/v1/favorites/:event_id` | お気に入りから削除 | 必要 |

### Connpass 連携

| メソッド | パス | 説明 | 認証 |
|---------|------|------|------|
| POST | `/api/v1/connpass/fetch` | Connpass から福島関連イベントを取得・保存 | 必要（MVP では admin のみ） |

### 訪問記録（マップ制覇）

Phase 4 機能（F-15）。

| メソッド | パス | 説明 | 認証 |
|---------|------|------|------|
| GET | `/api/v1/visit_records` | 自分の訪問記録一覧取得 | 必要 |
| POST | `/api/v1/visit_records` | 訪問記録を登録 | 必要 |
| DELETE | `/api/v1/visit_records/:id` | 訪問記録を削除 | 必要 |

---

## Connpass API 連携フロー

```
管理者が POST /api/v1/connpass/fetch を実行
  │
  ▼
Rails が Connpass API を呼び出す
  GET https://connpass.com/api/v1/event/?keyword=福島&count=100
  │
  ▼
レスポンスの events 配列を処理
  ├── connpass_id が DB に存在する → スキップ（重複防止）
  └── 存在しない → events テーブルに保存（source: 'connpass'）
  │
  ▼
保存完了。次回のイベント一覧取得時に自動表示される
```

---

## エラーレスポンス形式

```json
{
  "errors": ["メールアドレスまたはパスワードが正しくありません"]
}
```

| HTTP ステータス | 用途 |
|--------------|------|
| 200 | 成功（取得・更新） |
| 201 | 成功（作成） |
| 204 | 成功（削除） |
| 401 | 未認証（ログインが必要） |
| 403 | 権限なし（他人の記録は操作不可） |
| 404 | リソースが見つからない |
| 422 | バリデーションエラー |

---

## データ設計

テーブル定義・ER 図は [docs/database-design.md](./database-design.md) を参照。
