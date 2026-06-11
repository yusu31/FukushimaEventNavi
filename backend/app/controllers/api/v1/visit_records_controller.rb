# frozen_string_literal: true

module Api
  module V1
    class VisitRecordsController < ApplicationController
      before_action :set_dev_user

      def index
        records = @current_user.visit_records.order(visited_at: :desc)
        render json: records
      end

      def create
        record = @current_user.visit_records.build(visit_record_params)
        record.save!
        render json: record, status: :created
      rescue ActiveRecord::RecordInvalid => e
        render json: { errors: e.record.errors.full_messages }, status: :unprocessable_entity
      end

      def update
        record = @current_user.visit_records.find(params[:id])
        record.update!(visit_record_params)
        render json: record
      rescue ActiveRecord::RecordInvalid => e
        render json: { errors: e.record.errors.full_messages }, status: :unprocessable_entity
      end

      def destroy
        record = @current_user.visit_records.find(params[:id])
        record.destroy!
        render json: { message: "Record deleted" }
      end

      private

      def set_dev_user
        @current_user = User.first
      end

      def visit_record_params
        params.require(:visit_record).permit(
          :municipality, :companion_type, :photo_url, :visited_at, :memo, :event_id
        )
      end
    end
  end
end
