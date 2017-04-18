'use strict';

localStorage.debug = 'foglet-core:*';

const Foglet = require('foglet').Foglet;
const $ = window.$;
let o = [];

const max = 10;


for(let i = 0; i < max; ++i) {
	o[i] = new Foglet({
		protocol: 'foglet-example',
		webrtc:	{
			trickle: true,
			iceServers : []
		},
		signalingAdress:'http://localhost:3000/',
		room: 'best-room-for-foglet',
		verbose: true,
		rpsType: 'spray-wrtc-merging'
	});
}

const logs = (string) => {
	console.log(string);
	$('#appendLogs').append('<p>' + string + '</p>');
};


const directConnection = (time2wait = 500) => {
	let f = o[0];
	for(let i = 1; i < max; ++i) {
		let p = o[i];
		f.connection(p).then(d =>{
			logs(`=> Foglet ${f.options.rps.inviewId} has been connected with a direct connection to Foglet ${p.options.rps.inviewId}`);
		});
	}
};


const signalingConnection = (time2wait = 500) => {
	for (let i = 0; i < max; ++i) {
		(function (ind) {
			setTimeout(function () {
				o[ind].connection().then(d =>{
					logs(`=> Foglet number ${ind} has been connected on the room : ${o[ind].options.room}`);
				});
			}, (time2wait * ind));
		})(i);
	}
};

const peers = (k = Infinity) => {
	console.log(k);
	o.forEach(f => {
		logs('@' + f.options.rps.inviewId + ' Peers: ' + f.getNeighbours(k).toString());
	});
};
// Listeners for message
o.forEach(f => {
	f.options.rps.onUnicast((id, message) => {
		console.log(id, message);
		logs(`@${f.options.rps.inviewId} Receive a message from ${id}: ` + JSON.stringify(message));
	});
});
o.forEach(f => {
	f.onBroadcast((message) => {
		console.log(message);
		logs(`@${f.options.rps.inviewId} Receive a broadcast message : ` + JSON.stringify(message));
	});
});


const message = () => {
	const message = 'UNICAST, Hello world !';
	const id = o[0].getNeighbours();
	logs(`==> @${o[0].options.rps.inviewId} send a message to ${id}: ` + JSON.stringify(message));
	if(id.length > 0) {
		id.forEach(i => {
			o[0].sendUnicast(message, i);
		});
	}
};
const broadcast = () => {
	let f = o[0];
	logs(`==> @${f.options.rps.inviewId} send a broadcast message: `);
	console.log(f.sendBroadcast('BROADCAST, Hello world ! from '+f.options.rps.inviewId));
};

o.forEach(f => {
	f.addRegister('test');
});
