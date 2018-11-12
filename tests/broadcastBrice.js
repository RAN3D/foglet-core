const Foglet = require('../src/foglet.js')

const a = create('a')
const b = create('b')
const c = create('c')

function create(id) {
	return new Foglet({
		id,
		rps: {
			options: {
				maxPeers: 2,
				delta: 5000 * 1000,	
				// simple-peer moc
				socketClass: require('../foglet-core.js').SimplePeerMoc
			}
		}
	})
}

a.overlay().communication.onBroadcastBrice((id, message) => {
	console.log('a receive: ', id, message)
})
b.overlay().communication.onBroadcastBrice((id, message) => {
	console.log('b receive: ', id, message)
})

a.connection(b).then(() => {
	console.log('%s is connected to %s', a.id, b.id)
	console.log(a.getNeighbours())
	console.log(b.getNeighbours())

	a.overlay().communication.sendBroadcastBrice('toto', a.id)
	//b.overlay().communication.sendBroadcastBrice('titi')
})



const foglets = []
for (let i = 0; i < 10; ++i) foglets.push(create('C-' + i))


function p(a) {
	return new Promise((resolve, reject) =>{
		setTimeout(() => {
			resolve(a + 10)
		}, 1000)
	})
}

p(5).then((result) => {
	console.log(result)
}).catch(e => {
	console.error(e)
})
console.log(5)