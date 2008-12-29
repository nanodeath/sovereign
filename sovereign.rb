require 'rubygems'
$:.unshift File.dirname(__FILE__) + '/sinatra/lib'
$:.unshift File.dirname(__FILE__) + '/couchrest/lib'
require 'sinatra'
require 'couchrest'

configure do
  enable :sessions
  
  module RFC822
    EmailAddress = begin
      qtext = '[^\\x0d\\x22\\x5c\\x80-\\xff]'
      dtext = '[^\\x0d\\x5b-\\x5d\\x80-\\xff]'
      atom = '[^\\x00-\\x20\\x22\\x28\\x29\\x2c\\x2e\\x3a-' +
      '\\x3c\\x3e\\x40\\x5b-\\x5d\\x7f-\\xff]+'
      quoted_pair = '\\x5c[\\x00-\\x7f]'
      domain_literal = "\\x5b(?:#{dtext}|#{quoted_pair})*\\x5d"
      quoted_string = "\\x22(?:#{qtext}|#{quoted_pair})*\\x22"
      domain_ref = atom
      sub_domain = "(?:#{domain_ref}|#{domain_literal})"
      word = "(?:#{atom}|#{quoted_string})"
      domain = "#{sub_domain}(?:\\x2e#{sub_domain})*"
      local_part = "#{word}(?:\\x2e#{word})*"
      addr_spec = "#{local_part}\\x40#{domain}"
      pattern = /\A#{addr_spec}\z/
    end
  end
  
  CouchRest::Model.default_database = CouchRest.database!('http://localhost:5984/sovereign')
  
  # load objects
  Dir[File.dirname(__FILE__) + '/objects/*.rb'].each do |file|
    require file
  end
end

get '/' do
  haml :index
end

db = CouchRest.database('http://localhost:5984/sovereign')

helpers do
  def reset_logged_in(duration=60*15)
    set_cookie('logged_in', {:value => 'true', :expires => Time.new + duration})
  end  
end

get '/css/*.sass' do
  content_type 'text/css', :charset => 'utf-8'
  sass "/sass/#{params[:splat].first}".to_sym
end

post '/session/new' do
  failure = nil  
  if params[:login] == '' || params[:password] == ''
    # Username or password not given
    failure = "no_user_or_password_given"
  else
#    result = db.view("frontend/all_users", {:key => params[:login]})['rows'].first
    result = User.by_username(:key => params[:login]).first
    if result.nil?
      # User not found
      if(params[:login] =~ /[^a-zA-Z]/)
        failure = 'invalid_user'
      else
        failure = "user_not_found"
      end
      
    elsif not result.password_matches(params[:password])
      # User found, but wrong password
      failure = "wrong_password"
    else
      # User found, and right password
      set_cookie("user_id", result.id)
      set_cookie("user_username", result.username)
      reset_logged_in
    end
  end
  
  if failure.nil?
    "{'operation': 'login', 'status': 'ok'}"
  else
    "{'operation': 'login', 'status': 'fail', 'message': '#{failure}'}"
  end
end

post '/user/new' do
  failure = nil
  if params[:email].empty?
    failure = 'no_email'
  elsif not params[:email] =~ RFC822::EmailAddress
    failure = 'invalid_email'
  elsif(params[:login] =~ /[^a-zA-Z]/ or false) # s/false/invalid password/
    failure = 'tampering'
  else
    # Valid email
    salt = '1234'
    #password_hash = Digest::SHA1.hexdigest(params[:password] + salt)
    #response = db.save({:type => 'user', :username => params[:login], :salt => salt, :password_hash => password_hash})
    user = User.new(:username => params[:login], :salt => salt, :password_hash => params[:password], :email => params[:email])
    user.save
    
    kingdom = Kingdom.new(:user_id => user.id)
    kingdom.save
    
    province = Province.new(:kingdom_id => kingdom.id)
    province.save
    
    set_cookie("user_id", user.id)
    set_cookie("user_username", params[:login])
    reset_logged_in
  end
  
  if failure.nil?
    "{'operation': 'register', 'status': 'ok'}"
  else
    "{'operation': 'register', 'status': 'fail', 'message': '#{failure}'}"
  end  
end

get '/_*' do
  haml "/partials/#{params[:splat].first}".to_sym, :layout => false
end

get '/kingdom/*' do
  haml "/partials/kingdom/#{params[:splat].first}".to_sym, :layout => false
end