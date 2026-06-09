# frozen_string_literal: true

module Api
  module V1
    class SchedulesController < BaseController
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
    end
  end
end
