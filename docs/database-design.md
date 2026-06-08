# データベース設計書

## ER 図

```
users                          events
───────────────────            ─────────────────────────────────
id             PK              id              PK
email          string          title           string
encrypted_password string      description     text
created_at     datetime        location        string
updated_at     datetime        area            string
     │                         category        string
     │                         start_at        datetime
     │                         end_at          datetime
     │                         capacity        integer
     │                         event_url       string
     │                         image_url       string
     │                         source          string  ← 'connpass' 固定
     │                         connpass_id     integer
     │                         created_at      datetime
     │                         updated_at      datetime
     │                              │                │
     │         schedules            │                │
     │         ──────────────────   │                │
     ├── user_id (FK ──────────────┤)                │
     │         event_id (FK ───────┘)                │
     │         created_at datetime                   │
     │         updated_at datetime                   │
     │                                               │
     │         favorites                             │
     │         ──────────────────                    │
     ├── user_id (FK)                                │
     │         event_id (FK ──────────────────────── ┘)
     │         created_at datetime
     │         updated_at datetime
     │
     │         visit_records
     │         ──────────────────────────────────────
     └── user_id (FK)
               event_id (FK → events.id)
               municipality   string
               companion_type string
               photo_url      string
               visited_at     datetime
               created_at     datetime
               updated_at     datetime
```

---

## テーブル定義

### users テーブル

Devise が自動生成するテーブル。手動でカラムを追加しない。

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|-----|------|-----------|------|
| id | bigint | NOT NULL | AUTO_INCREMENT | 主キー |
| email | varchar(255) | NOT NULL | - | メールアドレス（ユニーク） |
| encrypted_password | varchar(255) | NOT NULL | '' | Devise がハッシュ化して保存 |
| reset_password_token | varchar(255) | NULL | - | パスワードリセット用トークン |
| reset_password_sent_at | datetime | NULL | - | リセットメール送信日時 |
| remember_created_at | datetime | NULL | - | ログイン維持の記録 |
| created_at | datetime | NOT NULL | - | 作成日時 |
| updated_at | datetime | NOT NULL | - | 更新日時 |

### events テーブル

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|-----|------|-----------|------|
| id | bigint | NOT NULL | AUTO_INCREMENT | 主キー |
| title | varchar(255) | NOT NULL | - | イベント名 |
| description | text | NULL | - | 詳細説明 |
| location | varchar(255) | NULL | - | 開催場所（会場名・住所） |
| area | varchar(50) | NOT NULL | - | 地域（下記参照） |
| category | varchar(50) | NOT NULL | - | カテゴリ（下記参照） |
| start_at | datetime | NOT NULL | - | 開始日時 |
| end_at | datetime | NULL | - | 終了日時 |
| capacity | integer | NULL | - | 定員（任意） |
| event_url | varchar(255) | NULL | - | 外部リンク（Connpass URL など） |
| image_url | varchar(255) | NULL | - | イベント画像URL（未設定時はカテゴリ別デフォルト画像を使用） |
| source | varchar(20) | NOT NULL | 'connpass' | 登録元（現在は connpass のみ） |
| connpass_id | integer | NULL | - | Connpass イベント ID（重複防止用） |
| created_at | datetime | NOT NULL | - | 作成日時 |
| updated_at | datetime | NOT NULL | - | 更新日時 |

#### area カラムの値

| 値 | 表示名 |
|----|--------|
| koriyama | 郡山市 |
| motomiya | 本宮市 |
| iwaki | いわき市 |
| fukushima | 福島市 |
| aizuwakamatsu | 会津若松市 |
| other | その他 |

#### category カラムの値

| 値 | 表示名 |
|----|--------|
| it | IT・テクノロジー |
| music | 音楽 |
| sports | スポーツ |
| food | グルメ・食 |
| art | アート・文化 |
| outdoor | アウトドア |
| family | ファミリー・子ども向け |
| other | その他 |

### schedules テーブル

カレンダーに「予定として追加」したイベントを管理する中間テーブル（F-04）。

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|-----|------|-----------|------|
| id | bigint | NOT NULL | AUTO_INCREMENT | 主キー |
| user_id | bigint | NOT NULL | - | ユーザー ID（外部キー） |
| event_id | bigint | NOT NULL | - | イベント ID（外部キー） |
| created_at | datetime | NOT NULL | - | 予定追加日時 |
| updated_at | datetime | NOT NULL | - | 更新日時 |

**ユニーク制約：** `user_id` + `event_id` の組み合わせは重複禁止

### favorites テーブル

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|-----|------|-----------|------|
| id | bigint | NOT NULL | AUTO_INCREMENT | 主キー |
| user_id | bigint | NOT NULL | - | ユーザー ID（外部キー） |
| event_id | bigint | NOT NULL | - | イベント ID（外部キー） |
| created_at | datetime | NOT NULL | - | お気に入り登録日時 |
| updated_at | datetime | NOT NULL | - | 更新日時 |

**ユニーク制約：** `user_id` + `event_id` の組み合わせは重複禁止

### visit_records テーブル

マップ制覇機能（F-15）の訪問記録テーブル。

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|-----|------|-----------|------|
| id | bigint | NOT NULL | AUTO_INCREMENT | 主キー |
| user_id | bigint | NOT NULL | - | ユーザー ID（外部キー） |
| event_id | bigint | NOT NULL | - | 参加したイベント ID（外部キー） |
| municipality | varchar(100) | NOT NULL | - | 訪問した市町村名（例: 郡山市） |
| companion_type | varchar(20) | NOT NULL | - | 同行者区分（下記参照） |
| photo_url | varchar(255) | NULL | - | アップロードした写真 URL |
| visited_at | datetime | NOT NULL | - | 訪問日時 |
| created_at | datetime | NOT NULL | - | 作成日時 |
| updated_at | datetime | NOT NULL | - | 更新日時 |

#### companion_type カラムの値

| 値 | 表示名 |
|----|--------|
| family | 家族 |
| partner | 恋人 |
| solo | 一人 |
| friends | 友人 |

---

## インデックス設計

| テーブル | カラム | 種別 | 理由 |
|---------|-------|------|------|
| users | email | UNIQUE | ログイン時の検索を高速化 |
| events | start_at | INDEX | 日付絞り込みを高速化 |
| events | area | INDEX | 地域絞り込みを高速化 |
| events | category | INDEX | カテゴリ絞り込みを高速化 |
| events | connpass_id | UNIQUE | 重複取込み防止 |
| schedules | (user_id, event_id) | UNIQUE | 重複予定登録防止 |
| favorites | (user_id, event_id) | UNIQUE | 重複お気に入り防止 |
| visit_records | (user_id, municipality) | INDEX | マップ制覇画面の表示を高速化 |

---

## マイグレーション実行順序

```
1. create_users          ← Devise が自動生成
2. create_events         ← events テーブル作成
3. create_schedules      ← schedules テーブル作成（users・events より後）
4. create_favorites      ← favorites テーブル作成（users・events より後）
5. create_visit_records  ← visit_records テーブル作成（users・events より後）
```
