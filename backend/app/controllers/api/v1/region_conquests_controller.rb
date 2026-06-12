# frozen_string_literal: true

module Api
  module V1
    class RegionConquestsController < BaseController
      def index
        conquests = current_user.region_conquests.order(conquered_at: :asc)
        render json: conquests
      end

      def destroy_all
        current_user.region_conquests.destroy_all
        render json: { message: "Cleared" }
      end

      def create
        conquest = current_user.region_conquests.find_or_initialize_by(
          region_id: conquest_params[:region_id]
        )
        conquest.conquered_at ||= conquest_params[:conquered_at] || Time.current
        conquest.save!
        render json: conquest, status: :created
      rescue ActiveRecord::RecordInvalid => e
        render json: { errors: e.record.errors.full_messages }, status: :unprocessable_entity
      end

      private

      def conquest_params
        params.require(:region_conquest).permit(:region_id, :conquered_at)
      end
    end
  end
end
