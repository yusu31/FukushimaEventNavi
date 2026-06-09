# frozen_string_literal: true

DeviseTokenAuth.setup do |config|
  # ヘッダートークンをリクエストごとに更新しない（フロントエンド実装を簡略化するため）
  config.change_headers_on_each_request = false
  config.token_lifespan = 2.weeks
  config.batch_request_buffer_throttle = 5.seconds
  # Rails API モードではセッションが無効なため bypass_sign_in を無効化
  config.bypass_sign_in = false
end
