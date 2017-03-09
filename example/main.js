'use strict';

const Foglet = require('foglet');
const $ = window.$;
let o = [];

let callbacks = function (src, dest) {
	return {
		onInitiate: function (offer) {
			dest.connection(callbacks(dest, src), offer);
		},
		onAccept: function (offer) {
			dest.connection(offer);
		},
		onReady: function (id) {
			console.log('[DIRECT:CALLBACK] Connected to : ', id);
		}
	};
};

const max = 3;


for(let i = 0; i < max; ++i) {
	o[i] = new Foglet({
		protocol: 'foglet-example',
		webrtc:	{
			trickle: false,
			iceServers : []
		},
		room: 'best-room-for-foglet',
		verbose: true
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
			logs(`=> Foglet ${f.id} has been connected with a direct connection to Foglet ${p.id}`);
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
