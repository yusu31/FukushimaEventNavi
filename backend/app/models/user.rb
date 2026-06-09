# frozen_string_literal: true

class User < ApplicationRecord
  include DeviseTokenAuth::Concerns::User

  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable,
         :confirmable

  has_many :favorites, dependent: :destroy
  has_many :schedules, dependent: :destroy
  has_many :visit_records, dependent: :destroy
  has_many :favorite_events, through: :favorites, source: :event
  has_many :scheduled_events, through: :schedules, source: :event
end
