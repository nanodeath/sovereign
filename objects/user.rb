require 'digest/sha1'

class User < CouchRest::Model
  key_reader :username, :salt, :password_hash, :email
  
  key_reader :created_at, :updated_at
  
  view_by :username
  
  timestamps!
  
  before :create, :salt_hash
  
  def salt_hash
    self['password_hash'] = Digest::SHA1.hexdigest(self['password_hash'] + self['salt'].to_s)
  end
  
  def password_matches(password)
    Digest::SHA1.hexdigest(password + self['salt'].to_s) == self['password_hash']
  end
end