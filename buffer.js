var events = require('./events');
var funcs = require('./functions');
var mylog = funcs.mylog;
var initFinished = events.initFinished;
var aktValues = {
};
var aktTypes = {
};

function readValues(data)
{
    var newValues = {
    };
    var newTypes = {
    };
    var lastHeader;
    var allLines = data.toString().split("\n");

    var selLines =[];
    var ln = 0;
    allLines.forEach(function (line)
        {
            line = line.trim();

            // ignore empty lines
            if (line == '') {
                return;
            };

            // ignore headers
            if (line.substr(line.length - 1) == ':')
            {
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
        }
    );

    aktValues = JSON.parse(JSON.stringify(newValues));
    aktTypes = JSON.parse(JSON.stringify(newTypes));
    mylog("aktValues:", 2);
    mylog(JSON.stringify(aktValues), 2);
}

function setActValue(key, value)
{
    if (typeof(aktValues[key]) == 'undefined' || aktValues[key] != value)
    {
        aktValues[key] = value;
        return true;
    }
    else
    {
        return false;
    }
}

function checkValue(key)
{
    if (key === 'all')
    {
        return aktValues;
    }
    else if (typeof(aktValues[key]) == 'undefined')
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

function getAllSwitches()
{
    var allSwitches = [];
    for (var unit in aktValues)
    {
        var value = aktValues[unit];
        if (value.substr(0, 4) === 'set_')
        {
            value = value.substr(4);
        }
        if (value === 'on' || value === 'off' || value === 'toggle')
        {
            allSwitches.push(unit);
        }
    }
    return allSwitches;
}

function getAllUnitsOf(type)
{
    var units =[];
    for (var key in aktTypes)
    {
        if (aktTypes[key] === type)
        {
            units.push(key);
        }
    }
    return units;
}

exports.checkValue = checkValue;
exports.readValues = readValues;
exports.getAllSwitches = getAllSwitches;
exports.getAllUnitsOf = getAllUnitsOf;
exports.setActValue = setActValue;