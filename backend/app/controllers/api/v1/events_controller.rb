# frozen_string_literal: true

module Api
  module V1
    class EventsController < ApplicationController
      def index
        events = Event.order(start_at: :asc)
        render json: events
      end

      def show
        event = Event.find(params[:id])
        render json: event
      end
    end
  end
end
