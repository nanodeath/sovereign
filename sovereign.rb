require 'rubygems'
$:.unshift File.dirname(__FILE__) + '/sinatra/lib'
$:.unshift File.dirname(__FILE__) + '/couchrest/lib'
$:.unshift File.dirname(__FILE__) + '/ranno/lib'
require 'sinatra'
require 'couchrest'
require 'ranno'

load 'configure.rb'

# load objects
Dir[File.dirname(__FILE__) + '/objects/*.rb'].each do |file|
  load file
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

  def stylesheet(ss, type = :css)
    suffix = (type == :css ? '.css' : '.sass')
    if(ss.is_a? Array)
      ss.collect {|s| stylesheet(s, type)}.join("\n")
    else
      asset(ss + suffix, :stylesheet)
    end
  end
  
  def javascript(js)
    suffix = '.js'
    if(js.is_a? Array)
      js.collect {|j| javascript(j)}.join("\n")
    else
      asset(js + suffix, :javascript)
    end
  end

  def asset(ass, type)
    case type
    when :stylesheet
      ass = '/css/' + ass unless ass[0..3] == 'http'
      "<link href=\"#{ass}\" type=\"text/css\" rel=\"stylesheet\" />"
    when :javascript
      ass = '/js/' + ass unless ass[0..3] == 'http'
      "<script src=\"#{ass}\" type=\"text/javascript\" rel=\"stylesheet\"></script>"
    end
  end
end

class Array
  def to_hash(default = 0, flatten=true)
    (flatten ? self.flatten : self).inject({}) {|memo, n| memo[n] = default; memo}
  end
end

get '/css/:sass.sass' do
  content_type 'text/css', :charset => 'utf-8'
  sass "/sass/#{params[:sass]}".to_sym
end

get '/_:partial' do
  report_completion(params[:partial], nil, :html => haml("/partials/#{params[:partial]}".to_sym, :layout => false))
end

# load routes
Dir[File.dirname(__FILE__) + '/routes/*.rb'].each do |file|
  load file
end