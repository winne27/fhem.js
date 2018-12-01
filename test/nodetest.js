var changedValues = '';
var socket = io.connect('ws://your.domain.tld:8086', {
	timeout: 5000,
	'sync disconnect on unload' : true
});

socket.on('connect', function() {
	socket.emit('getAllValuesOnChange');
	socket.emit('getAllDevicesOnChange');

	// request reading of specified fhem unit on change 
	socket.emit('getReadingOnChange', {
		unit: 'unit-name',
		reading: 'reading-name'
	});
	
	// request json2 of specified fhem unit on change 
	socket.emit('getDeviceOnChange', 'unit-name');

	socket.emit('getAllValues', function(data) {
		var out = '';
		for (unit in data) {
			var value = data[unit];
			out = out + unit + ': ' + value + "<br>";
		}
		document.getElementById("container1").innerHTML = out;
	});

	socket.emit('JsonList2', 'your_fhem_device', function(data) {
		console.log(data);
	});
});

socket.on('value',function(data) {
	for (unit in data) {
		var value = data[unit];
		changedValues = changedValues + unit + ': ' + value + "<br>";
	}
	document.getElementById("container2").innerHTML = changedValues;
});

socket.on('device',function(data) {
	console.log('device');
	console.log(data);
});

socket.on('reading',function(data) {
	console.log('reading');
	console.log(data);
});

socket.on('disconnect', function() {
	console.log('disconnected from server');
});