'use strict';

const Socket = require('./../src/utils/socket.js').Socket;
const wrtc= require('wrtc');
const options = {
	neighborhood: {
		webrtc: {
			trickle: true,
			iceServers: [],
			wrtc
		},
		protocol: 'lol' 
	},
	signalOffer: 'new',
	signalAccept: 'accept',
	signalOnOffer: 'new_spray',
	signalOnAccept: 'accept_spray',
	signalOnReady: 'onReady',
	signalingAdress: 'http://localhost:3000',
	signalRoom: 'joinRoom',
	signalOnRoom: 'joinedRoom',
	verbose: true
};

let arr = [];
for(let i = 0; i<10; i++) {
	let s = new Socket(options);
	arr.push(s);
}

arr.forEach( p => {
	arr.forEach( p2 => {
		if(p.id !== p2.id) {
			p.connection(p2);
		}
	});
});

let a = new Socket(options);
let b = new Socket(options);

a.connection(b);
// // let c = new Socket(options);
//
// /**
//  * LET'S DEFINE SOME CALLBACKS
//  */
//
// // a =================================
// a.on('joinedRoom', () => {
// 	console.log(a.connection());
// 	// b.join('default');
// });
// a.on('onReady', (data) => {
// 	console.log('A is connected to : ', data);
// 	console.log('A neighbours : ', a.getNeighbours());
// });
// a.on('receive', (data) => {
// 	const id = data.id;
// 	const message = data.message;
// 	if(message.type && message.type==='request' ) {
// 		console.log(message);
// 		const msg = {
// 			type: 'answer',
// 			message: '[@PONG] from : '+ a.socket.ID
// 		}
// 		a.send(id, msg);
// 	}
// });
//
// // // b ==================================
// // b.on('joinedRoom', () => {
// // 	console.log(b.connection());
// // });
// // b.on('receive', (id, message) => {
// // 	console.log(id, message);
// // });
// // b.on('onReady', (data) => {
// // 	console.log('B is connected to : ', data);
// // 	// now we can send a message to myself or to a
// // 	b.send(b.id, 'Hello world ! from b');
// // 	b.send(a.id, 'Hello world ! from b');
// // 	a.send(b.id, 'Hello world ! from a');
// // 	a.send(a.id, 'Hello world ! from a');
// // 	console.log('B neighbours : ', b.getNeighbours());
// // });
//
// // join part ============================
// a.join('default');
//
// const ping = () => {
// 	a.getNeighboursId().forEach( id => a.send(id, {type: 'request', message:'[@PING] from :'+a.socket.ID}));
// };
// const neigh = () => {
// 	console.log(a.getNeighbours(), b.getNeighbours(), c.getNeighbours());
// }
