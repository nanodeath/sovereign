class Kingdom < CouchRest::Model
  key_accessor :user_id
  view_by :user_id

  key_accessor :buildings_available

  def user
    @user ||= User.get(user_id)
  end
  
  def provinces
    Province.by_kingdom_id(:key => id)
  end

  def initialize(opts)
    super(opts)
    self.buildings_available = [Building::HOME, Building::FARM, Building::BARREN]
  end
end

get '/kingdom/:page' do
  @user = User.current_user(self)
  @kingdom = @user.kingdom
  @provinces = @kingdom.provinces
  haml "/partials/kingdom/#{params[:page]}".to_sym, :layout => false
end