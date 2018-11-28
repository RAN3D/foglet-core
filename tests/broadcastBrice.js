const Foglet = require('../src/foglet.js')

//***************** Test of causality begin *****************/
/*
const users = []
const nbUsers = 5

function create(id) {
	return new Foglet({
		id,
		rps: {
			options: {
				maxPeers: 3,
				delta: 600 * 1000,
				// simple-peer moc
				socketClass: require('../foglet-core.js').SimplePeerMoc
			}
		}
	})
}

// Creation of the users
for(var i = 0; i < nbUsers; ++i){
	users.push(create('C-' + i))
	users[i].overlay().communication.onBroadcastBrice((id, message) => {
		//console.log('receive : ', id, message)
	})
}

// Connection between userss
new Promise((resolve, reject) =>{
	for(var j = 0; j < nbUsers - 1; ++j){
		users[j].connection(users[j+1])
	}
	users[users.length-1].connection(users[0])
	resolve()
})

// Use this if you want to see the users' neighbours change periodically
for(var k = 0; k < nbUsers; ++k){
	neighbours(k, 20)
}


setTimeout(() => {
		var message1 = {message : 'differe', time : 5000}
		var message2 = 'tata'
		var message3 = {message : 'differe', time : 9000}
		users[0].overlay().communication.sendBroadcastBrice(message1, users[0].id)
		users[0].overlay().communication.sendBroadcastBrice(message2, users[0].id)
		users[0].overlay().communication.sendBroadcastBrice(message3, users[0].id)
}, 6000)
*/

//***************** Test of causality end *****************/


//***************** Test for the ping buffer begin *****************/
//*
const users = []
const nbUsers = 4

function create(id) {
	return new Foglet({
		id,
		rps: {
			options: {
				maxPeers: 3,
				delta: 600 * 1000,
				// simple-peer moc
				socketClass: require('../foglet-core.js').SimplePeerMoc
			}
		}
	})
}

// Creation of the users
for(var i = 0; i < nbUsers; ++i){
	users.push(create('C-' + i))
	users[i].overlay().communication.onBroadcastBrice((id, message) => {
		//console.log('receive : ', id, message)
	})
}

/*
// Use this if you want to see the users' neighbours change periodically
for(var k = 0; k < nbUsers; ++k){
	neighbours(k, 4)
}*/

// Connection between users and make the connections like this : C0 => C1 => C2 => C3 => C0
new Promise((resolve, reject) =>{
	//We have to make connection with cyclon
	for(var j = 0; j < nbUsers - 1; ++j){
		users[j].connection(users[j+1])
	}
	users[users.length-1].connection(users[0])
	users[0].connection(users[users.length-1])
	users[1].connection(users[3])

	for(var i = 0; i < nbUsers; ++i){
		neighboursNow(i)
	}

	setTimeout(() => {
		// we clear all the connection because they are unwanted
		for(var j = 0; j < nbUsers; ++j){
			users[j].overlay().communication.sendBroadcastBrice({message: 'disconnect all'}, users[j].id)
			users[j].overlay().communication.sendBroadcastBrice({message: 'clear'}, users[j].id)
		}

		for(var i = 0; i < nbUsers; ++i){
			neighboursNow(i)
		}
		setTimeout(() => {

			// We make our connections by ourself
			for(var j = 0; j < nbUsers - 1; ++j){
				users[j].overlay().communication.sendBroadcastBrice({message: 'open', id: users[j+1].id}, users[j].id)
			}
			users[3].overlay().communication.sendBroadcastBrice({message: 'open', id: users[0].id}, users[3].id)

			for(var i = 0; i < nbUsers; ++i){
				neighboursNow(i)
			}

			setTimeout(() => {

				// We try to make a new safe neighbour
				users[1].overlay().communication.sendBroadcastBrice({message: 'open with time', id: users[3].id}, users[1].id)
				setTimeout(() => {
					for(var i = 0; i < nbUsers; ++i){
						neighboursNow(i)
					}
				}, 1000)

				setTimeout(() => {

					// Two new message are received so they are put in the buffer
					users[0].overlay().communication.sendBroadcastBrice('message 1', users[0].id)
					users[0].overlay().communication.sendBroadcastBrice('message 2', users[0].id)

					users[1].overlay().communication.sendBroadcastBrice({message: 'buffer'}, users[1].id)

					for(var i = 0; i < nbUsers; ++i){
						neighboursNow(i)
					}

					// Again another one is received but the buffer is now to big so we reset it
					setTimeout(() => {
						users[0].overlay().communication.sendBroadcastBrice({message: 'message 3', wait: true}, users[0].id)

						users[1].overlay().communication.sendBroadcastBrice({message: 'buffer'}, users[1].id)

						for(var i = 0; i < nbUsers; ++i){
							neighboursNow(i)
						}

						// And we received another message that we put in the new buffer
						setTimeout(() => {
							for(var i = 0; i < nbUsers; ++i){
								neighboursNow(i)
							}

							users[0].overlay().communication.sendBroadcastBrice('message 4', users[0].id)

							users[1].overlay().communication.sendBroadcastBrice({message: 'buffer'}, users[1].id)

							setTimeout(() => {
								for(var i = 0; i < nbUsers; ++i){
									neighboursNow(i)
								}
								setTimeout(() => {
									users[1].overlay().communication.sendBroadcastBrice({message: 'buffer'}, users[1].id)
								}, 1000) 
							}, 4000)
						}, 1000)
					}, 1000)
				}, 3000)
			}, 7 * 1000)
		}, 2 * 1000)
	}, 2 * 1000)
	resolve()
})

//*/

/*/
//***************** Test for the ping buffer end *****************/


function neighbours(user, time) {
	return new Promise((resolve, reject) =>{
		setTimeout(() => {
			if(user == 0) {console.log('-------------------')}
			users[user].overlay().communication.sendBroadcastBrice('neighbours', users[user].id)
			neighbours(user, time)
			if(user == nbUsers - 1) {console.log('-------------------')}
		}, time * 1000)
	})
}

function neighboursNow(user) {
	return new Promise((resolve, reject) =>{
			setTimeout(() => {
				if(user == 0) {console.log('-------------------')}
				users[user].overlay().communication.sendBroadcastBrice('neighbours', users[user].id)
				if(user == nbUsers - 1) {console.log('-------------------')}
			}, 1000)
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
// Use this if you want the users to send message periodically
for(var l = 0; l < nbUsers; ++l ){
	sendMessage('toto' + l, l, 6)
}
*/
