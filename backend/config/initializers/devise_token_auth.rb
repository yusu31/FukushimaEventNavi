# frozen_string_literal: true

DeviseTokenAuth.setup do |config|
  # ヘッダートークンをリクエストごとに更新しない（フロントエンド実装を簡略化するため）
  config.change_headers_on_each_request = false
  config.token_lifespan = 2.weeks
  config.batch_request_buffer_throttle = 5.seconds
  # Rails API モードではセッションが無効なため bypass_sign_in を無効化
  config.bypass_sign_in = false
  # confirm_success_url を省略できるようにデフォルト値を設定
  config.default_confirm_success_url = "http://localhost:3000/events"
end
