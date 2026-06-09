# frozen_string_literal: true

module Api
  module V1
    class FavoritesController < BaseController
      def index
        favorites = current_user.favorites.includes(:event).order(created_at: :desc)
        render json: favorites.map { |f| { id: f.id, event_id: f.event_id, event: f.event } }
      end

      def create
        favorite = current_user.favorites.build(event_id: params[:event_id])
        favorite.save!
        favorite.reload
        render json: { id: favorite.id, event_id: favorite.event_id, event: favorite.event }, status: :created
      end

      def destroy
        favorite = current_user.favorites.find(params[:id])
        favorite.destroy!
        render json: { message: "Removed from favorites" }
      end
    end
  end
end
