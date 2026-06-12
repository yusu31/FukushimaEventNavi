# frozen_string_literal: true

module Api
  module V1
    class PersonalEventsController < BaseController
      def index
        personal_events = current_user.personal_events.order(:event_date)
        render json: personal_events
      end

      def create
        personal_event = current_user.personal_events.build(personal_event_params)
        personal_event.municipality = MunicipalityDetectorService.detect(personal_event.location)
        personal_event.save!
        render json: personal_event, status: :created
      end

      def update
        personal_event = current_user.personal_events.find(params[:id])
        new_params = personal_event_params
        personal_event.assign_attributes(new_params)
        personal_event.municipality = MunicipalityDetectorService.detect(personal_event.location)
        personal_event.save!
        render json: personal_event
      end

      def destroy
        personal_event = current_user.personal_events.find(params[:id])
        personal_event.destroy!
        render json: { message: "Deleted" }
      end

      private

      def personal_event_params
        params.require(:personal_event).permit(:title, :memo, :event_date, :start_time, :end_time, :location, :url)
      end
    end
  end
end
