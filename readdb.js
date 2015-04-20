var params  = require('./params');
var mysql   = require('mysql');
var fs      = require('fs');
var pw      = {};

function getDBvalue(dbObj,net)
{
   if (!pw[dbObj.host + '_' + dbObj.user])
   {
      pw[dbObj.host + '_' + dbObj.user] = fs.readFileSync(params.pwdir + '/pw_' + dbObj.host + '_' + dbObj.user).toString().replace(/^\s+|\s+$/g, '');
   }
   var connection = mysql.createConnection(
   {
      host     : dbObj.host,
      user     : dbObj.user,
      password : pw[dbObj.host + '_' + dbObj.user]
   });

   connection.connect();

   var sql = 'SELECT ' + dbObj.column + ' from ' + dbObj.table + ' order by ' + dbObj.sort + ' desc limit 1';
   connection.query(sql, function(err, rows, fields)
   {
      if (!err)
      {
         var value = rows[0][dbObj.column];
         var fhemcmd = net.connect({port: params.fhemPort}, function()
         {
            fhemcmd.write('set ' + dbObj.fhem_name + ' ' + value + '\r\n');
         });
         fhemcmd.setTimeout(10000);
         fhemcmd.on('data', function(data)
         {
            fhemcmd.end();
            fhemcmd.destroy();
         });
      }
      else
      {
         console.log('Error while performing Query.');
      }
      connection.end();
   });
}

exports.getDBvalue = getDBvalue;