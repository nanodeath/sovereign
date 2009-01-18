class Building
  HOME = :home
  FARM = :farm
  BARREN = :barren

  BUILDING_PICTURES = {
    HOME => 'home',
    FARM => 'farm_blueprint',
    BARREN => 'barren'
  }

  BUILDABLE_ON = {
    HOME => [
      BARREN
    ],
    FARM => [
      BARREN
    ]
  }

  IMAGE_FORMAT = '.png'

  attr_reader :btype
  def initialize(type)
    @btype = type
  end

  def picture
    '/img/' + BUILDING_PICTURES[@btype].to_s + IMAGE_FORMAT
  end

  def buildable_on
    BUILDABLE_ON[@btype]
  end
end
