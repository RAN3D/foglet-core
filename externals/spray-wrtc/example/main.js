const S = require('spray-wrtc');

const opts = {deltatime: 1000 * 60 * 1,
            webrtc: {trickle: true}};

// # create 3 peers
const s1 = new S(opts);
const s2 = new S(opts);
const s3 = new S(opts);

const callbacks = function (src, dest) {
	return {
		onInitiate(offer) {
			dest.connection(callbacks(dest, src), offer);
		},
		onAccept(offer) {
			dest.connection(offer);
		},
		onReady() {
			console.log('Connection established');
		}
	};
};

// #1 s1 joins s2 and creates a 2-peers networks
const id1 = s1.connection(callbacks(s1, s2));
// #2 after a bit, s3 joins the network through s1
setTimeout(() => {
	const id2 = s3.connection(callbacks(s3, s1));
}, 5000);

// #3 connection state changes
function changes(peer) {
	return function (state) {
		console.log('@' + peer + ' connection state ' + state);
	};
}

s1.on('statechange', changes('s1'));
s2.on('statechange', changes('s2'));
s3.on('statechange', changes('s3'));
