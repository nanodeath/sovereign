require 'rubygems'
$:.unshift File.dirname(__FILE__) + '/sinatra/lib'
$:.unshift File.dirname(__FILE__) + '/couchrest/lib'
require 'sinatra'
require 'couchrest'

load 'configure.rb'

# load objects
Dir[File.dirname(__FILE__) + '/objects/*.rb'].each do |file|
  require file
end

get '/' do
  haml :index
end

helpers do
  def report_completion(operation, error_message=nil, additional={})
    if(error_message.nil? or error_message == '')
      ret = {:operation => operation, :status => 'ok'}
    else
      ret = {:operation => operation, :status => 'fail', :message => error_message}
    end
    json ret.merge(additional)
  end

  def json(hash)
    raise ArgumentError unless hash.is_a?(Hash) || hash.respond_to?(:to_json)
    content_type 'text/json', :charset => 'utf-8'
    hash.to_json
  end
end

get '/css/:sass.sass' do
  content_type 'text/css', :charset => 'utf-8'
  sass "/sass/#{params[:sass]}".to_sym
end

get '/_:partial' do
  haml "/partials/#{params[:partial]}".to_sym, :layout => false
end

# load routes
Dir[File.dirname(__FILE__) + '/routes/*.rb'].each do |file|
  load file
end