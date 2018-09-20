require 'rubygems'
require 'mirage/client'

Before('@mockserver') do
    Mirage.start
    Mirage::Client.new.templates.delete_all
    Mirage::Client.new.put( 'token/create/server', "{ \"accessToken\": \"testapitoken\" }") do
        http_method :post
        status 200
    end
    
end

After('@mockserver') do
    Mirage.stop
end