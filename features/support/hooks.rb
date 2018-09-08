require 'rubygems'
require 'mirage/client'

Before('@mockserver') do
    Mirage.start
    Mirage::Client.new.put( 'token/create/server', 'testapitoken' ) do
        http_method :post
        status 200
        required_body_content << /client_secret=testserversecretstring/
    end
    
end

After('@mockserver') do
    Mirage.stop
end