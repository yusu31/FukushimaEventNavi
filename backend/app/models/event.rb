# frozen_string_literal: true

class Event < ApplicationRecord
  AREAS = %w[
    郡山市 福島市 いわき市 白河市 須賀川市 喜多方市 相馬市 二本松市
    田村市 南相馬市 伊達市 本宮市 その他
  ].freeze

  CATEGORIES = %w[
    スポーツ 音楽 アート 食・グルメ 自然・アウトドア 文化・伝統 ファミリー
    テクノロジー 教育 祭り・イベント その他
  ].freeze

  has_many :favorites, dependent: :destroy
  has_many :schedules, dependent: :destroy
  has_many :visit_records, dependent: :destroy

  validates :title, presence: true
  validates :area, presence: true, inclusion: { in: AREAS }
  validates :category, presence: true, inclusion: { in: CATEGORIES }
  validates :start_at, presence: true
  validates :connpass_id, uniqueness: true, allow_nil: true
end
