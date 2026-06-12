# frozen_string_literal: true

module Api
  module V1
    class ConquerController < BaseController
      # TODO(完成時): skip_before_action を削除し BaseController の認証を有効化すること
      skip_before_action :authenticate_user!
      before_action :set_dev_user

      # GET /api/v1/conquer/pending_confirmations
      # 過去の予定（schedules + personal_events）のうち、訪問記録がない市町村を返す
      def pending_confirmations
        pending = []

        # ── ① ユーザーがスケジュール登録したイベント（日付過去 & area 確定）──
        current_user.schedules
                    .joins(:event)
                    .where("events.start_at < ?", Time.current)
                    .where.not(events: { area: "その他" })
                    .includes(:event)
                    .each do |schedule|
          event = schedule.event

          # そのイベントに紐付いた訪問記録があれば確認済みとみなす
          next if current_user.visit_records.where(event_id: event.id).exists?

          pending << {
            municipality: event.area,
            source_type: "event",
            source_id: event.id,
            title: event.title,
            date: event.start_at.to_date.iso8601
          }
        end

        # ── ② municipality を設定した個人予定（日付過去）──
        current_user.personal_events
                    .where("event_date < ?", Date.current)
                    .where.not(municipality: [ nil, "" ])
                    .each do |pe|
          # 個人予定は event_id がないため日付ベースで判定（イベント日以降の訪問記録を確認）
          next if current_user.visit_records
                               .where(municipality: pe.municipality)
                               .where("visited_at >= ?", pe.event_date.beginning_of_day)
                               .exists?

          pending << {
            municipality: pe.municipality,
            source_type: "personal_event",
            source_id: pe.id,
            title: pe.title,
            date: pe.event_date.iso8601
          }
        end

        # ── municipality ごとにグループ化して返す ──
        grouped = pending
          .group_by { |p| p[:municipality] }
          .map do |municipality, sources|
            {
              municipality: municipality,
              sources: sources.map { |s| s.slice(:source_type, :source_id, :title, :date) }
            }
          end

        render json: grouped
      end

      private

      def set_dev_user
        @current_user = User.first!
      end

      def current_user
        @current_user
      end
    end
  end
end
