class Province < CouchRest::Model
  include Sinatra::Application::Model

  BABY_AGE = 0..4
  CHILD_AGE = 5..15
  ADULT_AGE = 16..50
  ELDERLY_AGE = 51..60
  
  key_accessor :kingdom_id
  view_by :kingdom_id

  # people is like {:men => [], :women => []} where the 0th item represents age 0, and 1 represents age 1, etc
  key_accessor :people

  key_accessor :buildings

  key_accessor :build_queue

  key_writer :name

  def kingdom
    Kingdom.get(kingdom_id)
  end

  def name
    if self[:name].nil?
      @name ||= kingdom.user.username + "'s Province"
    else
      self[:name]
    end
  end

  before :save, :pull_in_changes

  def pull_in_changes
    self.people = population.all unless @population.nil?
    self.buildings = buildings.all unless @buildings.nil?
    self.build_queue = build_queue.all unless @build_queue.nil?
  end
    
  def initialize(opts)
    super(opts)
    self.people = {:men => [0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 20], :women => [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 20]}
    self.buildings = {:homes => 20, :farms => 20, :barren => 60}
    self.build_queue = {:buildings => []}
  end

  def build_queue
    @build_queue ||= BuildQueue.new(self)
  end
  
  def buildings
    @buildings ||= Buildings.new(self)
  end
  
  def population
    @population ||= Population.new(self)
  end

  class BuildQueue
    def initialize(province)
      @build_queue = province['build_queue']
    end

    def all
      @build_queue
    end

    def get(category)
      @build_queue[category]
    end

    alias [] get
  end
  
  class Buildings
    def initialize(province)
      @province = province
      @buildings = province['buildings']
    end
    
    def all
      @buildings
    end
    
    def method_missing(methId, *args)
      if(@buildings.key? methId)
        @buildings[methId]
      else
        super
      end
    end
    
    def respond_to?(methId)
      if(@buildings.key? methId)
        return true
      else
        super
      end
    end

    def build_queue
      @province.build_queue[:buildings]
    end
  end
  
  class Population
    def initialize(province)
      @people = province.people
    end

    def all
      @people
    end

    def males
      @people[:men]
    end

    def females
      @people[:women]
    end
    
    def men
      males[ADULT_AGE] || []
    end
    
    def women
      females[ADULT_AGE] || []
    end
    
    def boys
      males[CHILD_AGE] || []
    end
    
    def girls
      females[CHILD_AGE] || []
    end
    
    def bebbies
      baby_girls = females[BABY_AGE] || []
      baby_boys = males[BABY_AGE] || []
      baby_girls.add(baby_boys)
    end
  end

  def self.routes
    Sinatra.application do |app|
      app.get '/province/summary' do
        @province = Province.get(params[:province])
        @province.validate_owner(session[:user_id])
        haml :'/province/summary', :layout => false
      end

      app.get '/province/people' do
        @province = Province.get(params[:province])
        @province.validate_owner(session[:user_id])
        @population = @province.population
        haml :'/province/people', :layout => false
      end

      app.get '/province/land' do
        @province = Province.get(params[:province])
        @province.validate_owner(session[:user_id])
        @buildings = @province.buildings
        haml :'/province/land', :layout => false
      end
    end
  end

  def validate_owner(user_id)
    @user = User.get(user_id)
    raise if @user.nil? or kingdom.user_id != @user.id
  end
end
