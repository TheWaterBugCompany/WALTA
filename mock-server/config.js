const path = require('path');
const config = {
	restPath: path.join(__dirname, '/rest'),
	uiPath: '/',
	title: 'Waterbug API Mock Server',
	version: 1,
	urlBase: 'http://192.168.6.85:7001',
	urlPath: '/v1',
	port: 7001,
	contentType: 'application/json',
	accessControlExposeHeaders: 'X-Total-Count',
	accessControlAllowOrigin: '*',
	accessControlAllowMethods: 'GET, POST, PUT, OPTIONS, DELETE, PATCH, HEAD',
	accessControlAllowHeaders: 'origin, x-requested-with, content-type',
	accessControlAllowCredentials: 'true',
	headers: {},
	open: true,
	dirName: __dirname,
	swaggerImport: {
		protocol: 'http',
		host: 'api.waterbugblitz.org.au',
		path: '/v1/swagger.json',
		dest: path.join(__dirname, '/swagger')
	}
}

module.exports = config;