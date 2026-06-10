# frozen_string_literal: true

require "net/http"
require "json"

module Api
  module V1
    class WeatherController < ApplicationController
      AREA_TO_CITY = {
        "郡山市"     => "Koriyama",
        "いわき市"   => "Iwaki",
        "本宮市"     => "Motomiya",
        "福島市"     => "Fukushima",
        "会津若松市" => "Aizuwakamatsu",
        "南相馬市"   => "Minamisoma",
        "白河市"     => "Shirakawa",
        "その他"     => "Fukushima"
      }.freeze

      def show
        area = params[:area].to_s
        date_str = params[:date].to_s

        city = AREA_TO_CITY[area]
        return render json: nil if city.blank?

        begin
          target_date = Date.parse(date_str)
        rescue ArgumentError
          return render json: nil
        end

        today = Date.today
        return render json: nil if target_date < today || target_date > today + 5

        forecast = fetch_forecast(city, target_date)
        render json: forecast
      end

      private

      def fetch_forecast(city, target_date)
        api_key = ENV["OPENWEATHERMAP_API_KEY"]
        uri = URI("https://api.openweathermap.org/data/2.5/forecast")
        uri.query = URI.encode_www_form(q: "#{city},JP", appid: api_key, lang: "ja", units: "metric")

        response = Net::HTTP.get_response(uri)
        return nil unless response.is_a?(Net::HTTPSuccess)

        data = JSON.parse(response.body)
        return nil unless data["list"]

        # 対象日の正午に最も近い予報データを選ぶ
        target_time = Time.utc(target_date.year, target_date.month, target_date.day, 12, 0, 0)
        entry = data["list"].min_by { |f| (Time.at(f["dt"]).utc - target_time).abs }
        return nil unless entry

        {
          icon:        entry["weather"][0]["icon"],
          description: entry["weather"][0]["description"],
          temp:        entry["main"]["temp"].round
        }
      rescue StandardError
        nil
      end
    end
  end
end
