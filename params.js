// port on which node.js service is reachable
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

// use SSL for conversation (true/false)
exports.useSSL = true;

// use connection password (true/false)
// it is recommended to use this only if useSSL is also true
// else the password is send as plain text
exports.useClientPassword = true;

// sha-256 hashed password
// create it on Linux shell with
// echo -n "mein Passwort" | sha256sum | cut -d' ' -f1
exports.connectionPassword = 'addb0f5e7826c857d7376d1bd9bc33c0c544790a2eac96144a8af22b1298c940';

// location of SSL and client-auth certificats
// only used then useSSL and/or useClientAuth set to true
exports.sslcert =
{
   key:    '/etc/ssl/private/bundle/ssl.key',
   cert:   '/etc/ssl/private/bundle/allcert.pem',
}
exports.cipher = 'HIGH:!aNULL:!MD5';
