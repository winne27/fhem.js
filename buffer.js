var events  = require('./events');
var initFinished = events.initFinished;
var aktValues = {};

function readValues(ios,type,data)
{
   var newValues = {};
   var allLines = data.toString().split("\n");

   var selLines = [];
   var ln = 0;
   allLines.forEach(function (line)
   {
      line = line.trim();
      if (line == '') {return;}; // ignore empty lines
      if (line.substr(line.length - 1) == ':') {return;}; // ignore headers
      if (line.substr(0,7) == 'telnet:') {return;}; // ignore telnet infos
      if (line.substr(0,8) == 'FHEMWEB:') {return;}; // ignore telnet infos
      ln++;
      if (ln == 1) {return}; //ignore first line

      var parts = line.split(/(\(|\))/g);
      var key = parts[0].trim();
      if (parts[2].substr(0,4) == 'set_') {return;}; // ignore set status
      newValues[key] = parts[2];
   });

   if (type == 'init')
   {
      aktValues = JSON.parse(JSON.stringify(newValues));
      initFinished.emit('true');
      //console.log(aktValues);
   }
   else
   {
      for (var key in newValues)
      {
         if (typeof(aktValues[key]) == 'undefined' || newValues[key] != aktValues[key])
         {
            aktValues[key] = newValues[key];
            var jsonValue = checkValue(key);
            //console.log(jsonValue);
            ios.sockets.in('all').emit('value',jsonValue);
            ios.sockets.in(key).emit('value',jsonValue);
         }
      }
   }
}

function checkValue(key)
{
   if (typeof(aktValues[key]) == 'undefined')
   {
      return false;
   }
   else
   {
      var jsonValue = {};
      jsonValue[key] = aktValues[key];
      return jsonValue;
   }
}

exports.checkValue = checkValue;
exports.readValues = readValues;
