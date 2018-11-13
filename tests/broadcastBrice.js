const Foglet = require('../src/foglet.js')

const users = []

const nbUsers = 5

function create(id) {
	return new Foglet({
		id,
		rps: {
			options: {
				maxPeers: 3,
				delta: 10 * 1000,	
				// simple-peer moc
				socketClass: require('../foglet-core.js').SimplePeerMoc
			}
		}
	})
}

for(var i = 0; i < nbUsers; ++i){
	users.push(create('C-' + i))
	users[i].overlay().communication.onBroadcastBrice((id, message) => {
		console.log('receive : ', id, message)	
	})
}

for(var j = 0; j < nbUsers - 1; ++j){
	users[j].connection(users[j+1])
}

// Use this if you want to see the users' neighbours change periodically
for(var k = 0; k < nbUsers; ++k){
	neighbours(k, 5)
}


/*
// Use this if you want the users to send message periodically
for(var l = 0; l < nbUsers; ++l ){
	sendMessage('toto' + l, l, 6)
}
*/

sendMessage('toto', 0, 6)

/*

for(var i = 0; i < 15; ++i){
	b.overlay().communication.sendBroadcastBrice('titi ' + i, b.id)
}

const a = create('a')
const b = create('b')
const c = create('c')

a.overlay().communication.onBroadcastBrice((id, message) => {
	console.log('a receive: ', id, message)
})

b.overlay().communication.onBroadcastBrice((id, message) => {
	console.log('b receive: ', id, message)
})

c.overlay().communication.onBroadcastBrice((id, message) => {
	console.log('c receive: ', id, message)
})

b.connection(c).then(() => {
	for(var i = 0; i < 15; ++i){
		b.overlay().communication.sendBroadcastBrice('titi ' + i, b.id)
	}
})

a.connection(b).then(() => {
	console.log('%s is connected to %s', a.id, b.id)
	console.log(a.getNeighbours())
	console.log(b.getNeighbours())

	for(var i = 0; i < 15; ++i){
		a.overlay().communication.sendBroadcastBrice('toto ' + i, a.id)
	}
})


const foglets = []
for (let i = 0; i < 10; ++i) foglets.push(create('C-' + i))
*/


function neighbours(user, time) {
	return new Promise((resolve, reject) =>{
		setTimeout(() => {
			if(user == 0) {console.log('-------------------')}
			console.log(users[user].id + ' neighbours : ' + users[user].getNeighbours())
			neighbours(user, time)
			if(user == nbUsers - 1) {console.log('-------------------')}
		}, time * 1000)
	})
}

// Use this fonction to call a send on an user 
function sendMessage(message, user2, time2){
	return new Promise((resolve, reject) =>{
		
		setTimeout(() => {
			console.log('-----------------------')
			users[user2].overlay().communication.sendBroadcastBrice(message, users[user2].id)
			sendMessage(message, user2, time2)
		}, time2 * 1000)
	})
}
/*
function p(a) {
	return new Promise((resolve, reject) =>{
		setTimeout(() => {
			resolve(a + 10)
		}, 5000)
	})
}


p(5).then((result) => {
	console.log(result)
}).catch(e => {
	console.error(e)
})
*/