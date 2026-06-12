# frozen_string_literal: true

require "net/http"
require "json"

# 場所テキスト or ジオコーディングから福島県の市町村名を自動判定するサービス
class MunicipalityDetectorService
  MUNICIPALITIES = %w[
    南相馬市 会津若松市 会津坂下町 会津美里町 南会津町
    福島市 郡山市 いわき市 白河市 須賀川市 喜多方市 相馬市
    二本松市 田村市 伊達市 本宮市 桑折町 国見町 川俣町 大玉村
    鏡石町 天栄村 中島村 矢吹町 棚倉町 矢祭町 塙町 鮫川村
    石川町 玉川村 平田村 浅川町 古殿町 三春町 小野町
    広野町 楢葉町 富岡町 川内村 大熊町 双葉町 浪江町 葛尾村
    新地町 飯舘村 北塩原村 西会津町 磐梯町 猪苗代町 湯川村
    柳津町 三島町 金山町 昭和村 西郷村 泉崎村 只見町
    下郷町 檜枝岐村
  ].freeze

  def self.detect(location_text)
    return nil if location_text.blank?

    # 1. テキストマッチング（長い名前から優先して部分一致）
    match = MUNICIPALITIES.find { |m| location_text.include?(m) }
    return match if match

    # 2. Nominatim ジオコーディング（無料 OpenStreetMap API）
    geocode(location_text)
  end

  def self.geocode(query)
    uri = URI("https://nominatim.openstreetmap.org/search")
    uri.query = URI.encode_www_form(
      q: "#{query} 福島県",
      countrycodes: "jp",
      format: "json",
      addressdetails: "1",
      limit: "1"
    )

    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = true
    http.open_timeout = 5
    http.read_timeout = 5

    req = Net::HTTP::Get.new(uri)
    req["User-Agent"] = "FukushimaEventNavi/1.0"
    req["Accept-Language"] = "ja"

    response = http.request(req)
    data = JSON.parse(response.body)
    return nil if data.empty?

    address = data.first["address"] || {}
    # city / town / village / county の順に確認
    candidate = address["city"] || address["town"] || address["village"] || address["county"] || ""

    MUNICIPALITIES.find { |m| candidate.include?(m) }
  rescue StandardError
    nil
  end
end
