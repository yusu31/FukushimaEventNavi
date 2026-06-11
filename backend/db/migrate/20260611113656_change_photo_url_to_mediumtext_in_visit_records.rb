class ChangePhotoUrlToMediumtextInVisitRecords < ActiveRecord::Migration[7.2]
  def up
    change_column :visit_records, :photo_url, :mediumtext
  end

  def down
    change_column :visit_records, :photo_url, :string, limit: 255
  end
end
