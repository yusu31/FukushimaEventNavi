# frozen_string_literal: true

module Api
  module V1
    class FavoritesController < BaseController
      def create
        favorite = current_user.favorites.build(event_id: params[:event_id])
        favorite.save!
        render json: favorite, status: :created
      end

      def destroy
        favorite = current_user.favorites.find(params[:id])
        favorite.destroy!
        render json: { message: "Removed from favorites" }
      end
    end
  end
end
