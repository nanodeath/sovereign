require 'rubygems'
$:.unshift File.dirname(__FILE__) + '/sinatra/lib'
$:.unshift File.dirname(__FILE__) + '/frankie/lib'
require 'sinatra'

get '/' do
  haml :index
end


