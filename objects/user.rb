require 'digest/sha1'

class User < CouchRest::Model
  include Sinatra::Application::Model

  USERNAME_PATTERN = /[^a-zA-Z]/

  key_reader :username, :salt, :password_hash, :email
  
  key_reader :created_at, :updated_at
  
  def kingdom
    Kingdom.by_user_id(:key => id).first
  end
  
  view_by :username
  
  timestamps!
  
  #  before :create, :salt_hash
  before :save, :salt_hash
  
  def salt_hash
    self['password_hash'] = Digest::SHA1.hexdigest(self['password_hash'] + self['salt'].to_s)
  end
  
  def password_matches(password)
    Digest::SHA1.hexdigest(password + self['salt'].to_s) == self['password_hash']
  end

  def setup_user
    kingdom = Kingdom.new(:user_id => id)
    kingdom.save

    province = Province.new(:kingdom_id => kingdom.id)
    province.save
  end
  
  def self.current_user(context)
    id = context.session[:user_id]
    puts "session is #{context.session.inspect}"
    id.nil? ? nil : get(id)
  end

  # takes :login, :password
  def self.sign_in(opts, ctx)
    if opts[:login] == '' or opts[:password] == ''
      # Username or password not given
      raise IncompleteCredentials
    end
    user = User.by_username(:key => opts[:login]).first

    if user.nil?
      # User not found
      # Remember this is also for registering
      if(!(opts[:login] =~ USERNAME_PATTERN))
        raise InvalidUsername
      else
        raise UserNotFound
      end
    elsif not user.password_matches(opts[:password])
      # User found, but wrong password
      raise WrongPassword
    end
    
    # User found, and right password
    user.sign_in(ctx)
  end

  def sign_in(ctx)
    ctx.session[:user_id] = id
    ctx.session[:user_username] = username
    self
  end

  def self.create_new(opts, ctx)
    if opts[:email].empty?
      raise NoEmailGiven
    elsif not opts[:email] =~ RFC822::EmailAddress
      raise InvalidEmail
    elsif opts[:login].empty? || opts[:password].empty?
      raise IncompleteUserDefinition
    elsif(!(opts[:login] =~ USERNAME_PATTERN))
      raise InvalidUsername
    end
    # Valid email
    salt = '1234'

    user = User.new(:username => opts[:login], :salt => salt, :password_hash => opts[:password], :email => opts[:email])
    user.save

    user
  end

  class LoginOrRegisterException < Exception
    def to_s
      'login_error'
    end
  end
  class InvalidUsername < LoginOrRegisterException
    def to_s
      'invalid_username'
    end
  end
  class IncompleteCredentials < LoginOrRegisterException
    def to_s
      'no_user_or_password_given'
    end
  end
  class UserNotFound < LoginOrRegisterException
    def to_s
      'user_not_found'
    end
  end
  class WrongPassword < LoginOrRegisterException
    def to_s
      'wrong_password'
    end
  end


  class RegisterException < Exception
    def to_s
      'register_error'
    end
  end
  class IncompleteUserDefinition < RegisterException
    def to_s
      'incomplete_user_definition'
    end
  end
  class NoEmailGiven < IncompleteUserDefinition
    def to_s
      'no_email'
    end
  end
  class InvalidEmail < RegisterException
    def to_s
      'invalid_email'
    end
  end

  def self.routes
    Sinatra.application do |app|
      app.get '/login_status' do
        json :user_id => session[:user_id], :user_username => session[:user_username]
      end

      app.post '/session/sign_out' do
        session.delete(:user_id)
        json :status => 'ok'
      end

      app.delete '/session' do
        session.clear
        json :status => 'ok', :noob => true
      end

      app.post '/session/new' do
        begin
          User.sign_in(params, self)
          report_completion('login')
        rescue User::LoginOrRegisterException => e
          report_completion('login', e.to_s)
        end
      end

      app.post '/user/new' do
        begin
          user = User.create_new(params, self)
          user.setup_user
          report_completion('register')
        rescue User::RegisterException => e
          report_completion('register', e.to_s)
        rescue User::LoginOrRegisterException => e
          report_completion('register', e.to_s)
        end
      end
    end
  end
end