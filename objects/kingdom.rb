class Kingdom < CouchRest::Model
  key_accessor :user_id
  view_by :user_id
end