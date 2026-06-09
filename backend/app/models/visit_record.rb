# frozen_string_literal: true

class VisitRecord < ApplicationRecord
  COMPANION_TYPES = %w[一人 家族 恋人 友人].freeze

  belongs_to :user
  belongs_to :event

  validates :municipality, presence: true
  validates :companion_type, presence: true, inclusion: { in: COMPANION_TYPES }
  validates :visited_at, presence: true
end
