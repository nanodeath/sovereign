class Province < CouchRest::Model
  BABY_AGE = 0..4
  CHILD_AGE = 5..15
  ADULT_AGE = 16..60
  
  key_accessor :kingdom_id
  view_by :kingdom_id
    
  key_accessor :people
  key_accessor :buildings
  # people is like {:men => [], :women => []} where the 0th item represents age 0, and 1 represents age 1, etc
    
#  view_by :owners,
#    :map => "function(doc){
#      if(doc['couchrest-type'] == 'Province'){
#        emit([null, doc.kingdom_id, doc._id], null);
#      } else if(doc['couchrest-type'] == 'Kingdom'){
#        emit([doc.user_id, doc._id], null);
#      } else if(doc['couchrest-type'] == 'User'){
#        emit([doc._id], null);
#      }
#      class Population
#    
#  end
#    }"
    
  def initialize(opts)
    super(opts)
    self.people = {:men => [0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 20], :women => [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 20]}
    self.buildings = {:homes => 20, :farms => 20, :barren => 60}
  end
    
  def population
    @population ||= Population.new(self)
  end
  
  def buildings
    @buildings ||= Buildings.new(self)
  end
  
  class Buildings
    def initialize(province)
      @buildings = province.buildings
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
  end
  
  
  class Population
    def initialize(province)
      @people = province.people
    end
    
    def men
      puts "in men: people is #{@people.inspect}"
      @people[:men][ADULT_AGE] || []
    end
    
    def women
      @people[:women][ADULT_AGE] || []
    end
    
    def boys
      @people[:men][CHILD_AGE] || []
    end
    
    def girls
      @people[:women][CHILD_AGE] || []
    end
    
    def bebbies
      baby_girls = @people[:women][BABY_AGE] || []
      baby_boys = @people[:men][BABY_AGE] || []
      baby_girls.add(baby_boys)
    end
  end
end

class Array
  def sum
    inject {|sum, n| sum + (n || 0)} || 0
  end
  
  # Sum two numeric arrays
  def add(other_array)
    raise ArgumentError unless other_array.is_a? Array
    (length > other_array.length ? zip(other_array) : other_array.zip(self)).collect(&:sum)
  end
end