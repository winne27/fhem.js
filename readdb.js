var mysql   = require('mysql');
var fs      = require('fs');
var params  = require('./params');
var funcs   = require('./functions');
var mylog   = funcs.mylog;
var pw      = {};

function getDBvalue(dbObj,fhemSocket)
{
   mylog('read ' + dbObj.column + ' from db',1);
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
         fhemSocket.write('set ' + dbObj.fhem_name + ' ' + value + '\r\n');
      }
      else
      {
         mylog('Error while performing Query:' + sql,0);
      }
      connection.end();
   });
}

exports.getDBvalue = getDBvalue;