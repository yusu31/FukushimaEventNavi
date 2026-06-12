# frozen_string_literal: true

module Api
  module V1
    class SchedulesController < BaseController
      skip_before_action :authenticate_user!
      before_action :set_dev_user

      def index
        schedules = current_user.schedules.includes(:event)
        render json: schedules.map { |s|
          s.event.as_json.merge(schedule_id: s.id)
        }
      end

      def create
        schedule = current_user.schedules.build(event_id: params[:event_id])
        schedule.save!
        render json: schedule, status: :created
      end

      def destroy
        schedule = current_user.schedules.find(params[:id])
        schedule.destroy!
        render json: { message: "Removed from schedule" }
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
