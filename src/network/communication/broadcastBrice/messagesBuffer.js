class messagesBuffer{

	constructor(){
		this.buffer = []
	}
	
	addUser(id){
		var index = this.buffer.indexOf(map => map[0] === id)
		if(index != -1){
			this.buffer.splice(index, 1)
		}
		this.buffer.push([id])
	}

	removeUser(id){
		var index = this.buffer.indexOf(map => map[0] === id)
		if(index != -1){
			this.buffer.splice(index, 1)
		}
	}

	addMessage(id, message){
		var index = this.buffer.indexOf(map => map[0] === id)
		if(index != -1){
			this.buffer[index].push(message)
		}
	}

	removeMessage(id, message){
		var indexI = this.buffer.indexOf(map => map[0] === id)
		if(indexI != -1){
			var indexM = this.buffer.indexOf(map => map[0] === id)
			if(indexM != -1){
				this.buffer[indexI].splice(indexM, 1)
			}
		}
	}
}

module.exports = messagesBuffer