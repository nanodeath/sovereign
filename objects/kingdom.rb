class Kingdom < CouchRest::Model
  include Sinatra::Application::Model
  
  key_accessor :user_id
  view_by :user_id
  
  def provinces
    Province.by_kingdom_id(:key => id)
  end
  
  def self.routes
    Sinatra.application do |app|
      app.get '/kingdom/:page' do
        @user = User.current_user(self)
        @kingdom = @user.kingdom
        @provinces = @kingdom.provinces
        haml "/partials/kingdom/#{params[:page]}".to_sym, :layout => false
      end
    end
  end
end