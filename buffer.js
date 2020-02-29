var net = require('net');
var events = require('./events');
var funcs = require('./functions');
var params = require('./params');
var mylog = funcs.mylog;
var initFinished = events.initFinished;
var aktValues = {};
var aktTypes = {};
var jsonBuffer = {};

function readValues(data) {
    var newValues = {};
    var newTypes = {};
    var lastHeader;
    var allLines = data.toString().split("\n");

    var ln = 0;
    allLines.forEach(function(line) {
        line = line.trim();

        // ignore empty lines
        if (line == '') {
            return;
        };

        // ignore headers
        if (line.substr(line.length - 1) == ':') {
            lastHeader = line.substr(0, line.length - 1);
            return;
        };

        // ignore telnet infos
        if (line.indexOf('telnet') >= 0) {
            return;
        };

        // ignore WebFhem infos
        if (line.indexOf('WEBFHEM') >= 0) {
            return;
        };

        // ignore WebFhem infos
        if (line.indexOf('FHEMWEB') >= 0) {
            return;
        };

        // ignore LogFile infos
        if (line.substr(0, 7) == 'FileLog') {
            return;
        };

        // ignore unpeered values
        if (line.indexOf('unpeered') > 0) {
            return;
        };

        // ignore Bye, last line infos
        if (line.indexOf('Bye...') >= 0) {
            return;
        };
        if (line.indexOf('Connection closed by') >= 0) {
            return;
        };

        //ignore first line
        ln++;
        if (ln == 1) {
            return
        };

        var parts = line.split(/(\(|\))/g);
        var key = parts[0].trim();

        newValues[key] = parts[2];
        newTypes[key] = lastHeader;
    });

    aktValues = JSON.parse(JSON.stringify(newValues));
    aktTypes = JSON.parse(JSON.stringify(newTypes));
    mylog("aktValues:", 2);
    mylog(JSON.stringify(aktValues), 2);
}

function setActValue(key, value) {
    if (typeof(aktValues[key]) == 'undefined' || aktValues[key] != value) {
        aktValues[key] = value;
        return true;
    } else {
        return false;
    }
}

function checkValue(key) {
    if (key === 'all') {
        return aktValues;
    } else if (typeof(aktValues[key]) == 'undefined') {
        return false;
    } else {
        var jsonValue = {};
        jsonValue[key] = aktValues[key];
        return jsonValue;
    }
}

function getAllSwitches() {
    var allSwitches = [];
    for (var unit in aktValues) {
        var value = aktValues[unit];
        if (value.substr(0, 4) === 'set_') {
            value = value.substr(4);
        }
        if (value === 'on' || value === 'off' || value === 'toggle') {
            allSwitches.push(unit);
        }
    }
    return allSwitches;
}

function getAllUnitsOf(type) {
    var units = [];
    for (var key in aktTypes) {
        if (aktTypes[key] === type) {
            units.push(key);
        }
    }
    return units;
}

function initJsonBuffer() {
	var fhemcmd = net.connect({ port: params.fhemPort, host: params.fhemHost }, function() {
	    
	});
	
	var answerStr = '';
	fhemcmd.on('data', function(response) {
	    answerStr += response.toString().replace("\n", "");
	});
	
	fhemcmd.on('end', function() {
	    var startPos = answerStr.indexOf('{');
	    var lastPos = answerStr.lastIndexOf('}');
	    answerStr = answerStr.substr(startPos, lastPos - startPos + 1);
	    var jsonFhem = JSON.parse(answerStr);
	    //console.log(jsonFhem);
	    
	    for (var index in jsonFhem.Results) {
	    	var unit = jsonFhem.Results[index].Name;
	    	var readings = jsonFhem.Results[index].Readings;

	    	for (var reading in readings) {
	    		if (reading != '__proto__') {
		    		if (!jsonBuffer[unit]) {
		    			jsonBuffer[unit] = new Object();
		    			jsonBuffer[unit]['fhemType'] = jsonFhem.Results[index].Internals.TYPE;
		    		}
		    		jsonBuffer[unit][reading] = readings[reading].Value;
	    		}
	    	}
	    }
	    
	    initFinished.emit('true');
	});

	fhemcmd.on('error', function() {
	    fhemcmd.destroy();
	    funcs.mylog('error: telnet connection failed', 0);
	});	
	fhemcmd.write(new Buffer("JsonList2;exit\r\n"));
}

function allUnitTypes() {
	var allUnitTypes = [];
	
	for (var key in jsonBuffer) {
		var fhemType = jsonBuffer[key].fhemType;
		if (!contains(allUnitTypes, fhemType)) {
			allUnitTypes.push(fhemType);
		}
	}
	
	return allUnitTypes;
}

function contains(a, val) {
    for (var i = 0; i < a.length; i++) {
        if (a[i] == val) {
            return true;
        }
    }
    return false;
}
exports.checkValue = checkValue;
exports.readValues = readValues;
exports.getAllSwitches = getAllSwitches;
exports.getAllUnitsOf = getAllUnitsOf;
exports.setActValue = setActValue;
exports.initJsonBuffer = initJsonBuffer;
exports.jsonBuffer = jsonBuffer;
exports.allUnitTypes = allUnitTypes;