var params  = require('./params');
// Datumsberechnungen
var getToday =
{
   myHumanReadable: function()
   {
      var day = new Date();
      return pad((+day.getDate()),2) + '.' + pad((+day.getMonth() + 1),2) + '.' + day.getFullYear() + ' ' +  pad((+day.getHours()),2) + ':' +  pad((+day.getMinutes()),2) + ':' +  pad((+day.getSeconds()),2) + ' ';
   },

   day: function()
   {
      var trenn = '-';
      var day = new Date();
      return day.getFullYear() + trenn + pad((+day.getMonth() + 1),2) + trenn + pad((+day.getDate()),2);
   },
};

exports.mylog = function(msg,level)
{
   if (typeof(level) === 'undefined') level = 0;
   if (level <= params.debug)
   {
      console.log(getToday.myHumanReadable() + msg);
   }
}

exports.myerr = function(socket, tag, data, err)
{
	if (params.debug > 0) {
		console.log(getToday.myHumanReadable() + ' ' + err + ' occured at ' + tag + ' (maybe the next log entry shows the corrupted data)');
		console.log(data);
	}
	var errdata = {
		tag: tag,
		errmsg: err,
		data: data
	};
	socket.emit('requestError', errdata);
}

function pad(number, length)
{
    var str = '' + number;
    while (str.length < length)
    {
        str = '0' + str;
    }
    return str;
}

exports.getToday = getToday;