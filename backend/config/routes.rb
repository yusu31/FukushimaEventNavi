Rails.application.routes.draw do
  mount_devise_token_auth_for "User", at: "auth"

  namespace :api do
    namespace :v1 do
      resources :events, only: %i[index show]
      resources :favorites, only: %i[create destroy]
      resources :schedules, only: %i[create destroy]
    end
  end

  get "up" => "rails/health#show", as: :rails_health_check
end
