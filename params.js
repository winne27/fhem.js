// port on which service is reachable
exports.nodePort = 8086;

// telnet port of FHEM server
exports.fhemPort = 7072;

// path for Webfiles (html,css,js, ...) !! no php !!
// change to path of web directory only if you want to deliver
// web files by this server
// set to false else
//exports.pathHTML = false;
exports.pathHTML = '/var/www/homepage';

// default html page
exports.indexHTML = 'index.html';

// use SSL for connection (true/false)
exports.useSSL = true;

// use certificate for client authentication (true/false)
exports.useClientAuth = false;

// location of SSL and client-auth certificats
// only used then useSSL and/or useClientAuth set to true
exports.sslcert =
{
   key:    '/etc/ssl/private/bundle/ssl.key',
   cert:   '/etc/ssl/private/bundle/allcert.pem',
   ca:     '/etc/ssl/private/client/ca.crt'
}
exports.cipher = 'HIGH:!aNULL:!MD5';
