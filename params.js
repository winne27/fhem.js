// set debugging (0,1,2)
exports.debug = 0;
// port on which node.js service is reachable
exports.nodePort = 8086;

// telnet port of FHEM server
exports.fhemPort = 7072;

// webserver root directory:
// path for Webfiles (html,css,js, ...) !! no php !!
// change to path of web directory only if you want to deliver
// web files by this server
// set to false else
exports.pathHTML = false;
//exports.pathHTML = '/var/www/homepage';

// default html page
exports.indexHTML = 'index.html';

// use SSL for conversation (true/false)
exports.useSSL = false;

// use connection password (true/false)
// it is recommended to use this only if useSSL is also true
// else the password is send as plain text
exports.useClientPassword = false;

// location of sha-256 hashed password
// only needed if useClientPassword = true
// create it on Linux shell with
// echo -n "mein Passwort" | sha256sum | cut -d' ' -f1 > /etc/fhem/pw_client_auth
exports.connectionPasswordFile = '/etc/fhem/pw_client_auth';

// location of SSL and client-auth certificats
// only used then useSSL set to true
exports.sslcert =
{
   key:    '/etc/ssl/private/bundle/ssl.key',
   cert:   '/etc/ssl/private/bundle/allcert.pem',
}
exports.cipher = 'HIGH:!aNULL:!MD5';

// use this application for providing mySql values to fhem
exports.readDB = false;

// in /etc/fhem (default) must exist a file named pw_host_user containing password for mysql connection
// every possible combination of host and user from readDBvalues below requires a password file
exports.pwdir = '/etc/fhem';


exports.readDBvalues =
[
   {table: 'wetterstation.weather', column: 'wind_gust', sort: 'datetime', fhem_name: 'windspeed', refresh: 60, host: 'localhost', user: 'fhem' }
];


