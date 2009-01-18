class Province < CouchRest::Model
  BABY_AGE = 0..4
  CHILD_AGE = 5..15
  ADULT_AGE = 16..50
  ELDERLY_AGE = 51..60

#  def self.building_image(type)
#    '/img/' + BUILDING_PICTURES[type] + IMAGE_FORMAT
#  end
  
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
    self.buildings = {:home => 20, :farm => 20, :barren => 60, :fertile => 20}
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

    def get_with_order(category)
      queue = get(category)
      ordered_queue = {}
      i = 1
      queue.each do |(building, quantity)|
        ordered_queue[building] = [quantity, i]
        i += 1
      end
      ordered_queue
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

  def validate_owner(user_id)
    @user = User.get(user_id)
    raise if @user.nil? or kingdom.user_id != @user.id
  end
end

get '/province/summary' do
  @province = Province.get(params[:province])
  @province.validate_owner(session[:user_id])
  report_completion('page_loading', nil, :html => (haml :'/province/summary', :layout => false), :page => 'province_summary')
end

get '/province/people' do
  @province = Province.get(params[:province])
  @province.validate_owner(session[:user_id])
  @population = @province.population
  report_completion('page_loading', nil, :html => (haml :'/province/people', :layout => false), :page => 'province_people')
end

get '/province/land' do
  @province = Province.get(params[:province])
  @province.validate_owner(session[:user_id])
  @kingdom = @province.kingdom
  @buildings = @province.buildings
  @build_queue = @province.build_queue.get_with_order(:buildings)
  report_completion('page_loading', nil, :html => (haml :'/province/land', :layout => false), :page => 'province_land')
end

post '/province/land/buildings' do
  @province = Province.get(params[:province])
  @province.validate_owner(session[:user_id])
  @buildings = @province.buildings
  @build_queue = @province.build_queue.get_with_order(:buildings)
  puts params.inspect
  report_completion('add_to_building_queue', nil, :html => (haml :'/province/land/buildings', :layout => false), :page => 'province_land')
end
