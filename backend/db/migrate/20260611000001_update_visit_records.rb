# frozen_string_literal: true

class UpdateVisitRecords < ActiveRecord::Migration[7.2]
  def change
    change_column_null :visit_records, :event_id, true
    add_column :visit_records, :memo, :text
  end
end
