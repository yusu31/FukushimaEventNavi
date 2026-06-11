Rails.application.routes.draw do
  mount_devise_token_auth_for "User", at: "auth"

  namespace :api do
    namespace :v1 do
      resources :events, only: %i[index show]
      resources :favorites, only: %i[index create destroy]
      resources :schedules, only: %i[index create destroy]
      resources :personal_events, only: %i[index create update destroy]
      resources :visit_records, only: %i[index create update destroy]
      resources :region_conquests, only: %i[index create] do
        collection do
          delete :destroy_all
        end
      end
      get "weather", to: "weather#show"
    end
  end

  get "up" => "rails/health#show", as: :rails_health_check
end
