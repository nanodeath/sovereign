class Building
  HOME = :home
  FARM = :farm
  BARREN = :barren
  FERTILE = :fertile

  BUILDING_PICTURES = {
    HOME => 'home',
    FARM => 'farm_blueprint',
    BARREN => 'barren',
    FERTILE => 'fertile'
  }

  BUILDABLE_ON = {
    HOME => [
      BARREN,
      FERTILE
    ],
    FARM => [
      FERTILE
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
