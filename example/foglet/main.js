'use strict';

localStorage.debug = 'foglet-core:*';

const Foglet = require('foglet').Foglet;
const $ = window.$;
let o = [];

const max = 3;


for(let i = 0; i < max; ++i) {
	o[i] = new Foglet({
		protocol: 'foglet-example',
		webrtc:	{
			trickle: false,
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
	o.forEach(f => {
		logs('@' + f.options.rps.inviewId + ' Peers: ' + f.getNeighbours(k).toString());
	});
};

const message = () => {
	o.forEach(f => {
		f.onUnicast((id, message) => {
			console.log(id, message);
			logs(`@${f.options.rps.inviewId} Receive a message from ${id}: ` + JSON.stringify(message));
		});
	});

	o.forEach(f => {
		const id = f.getNeighbours(1);
		const message = 'UNICAST, Hello world !';
		logs(`@${f.options.rps.inviewId} send a message to ${id}: ` + JSON.stringify(message));
		f.sendUnicast(message, id);
	});
};

const broadcast = () => {
	o.forEach(f => {
		f.onBroadcast((message) => {
			console.log(message);
			logs(`@${f.options.rps.inviewId} Receive a broadcast message : ` + JSON.stringify(message));
		});
	});

	o.forEach(f => f.sendBroadcast('BROADCAST, Hello world ! from '+f.options.rps.inviewId));
};
