class messagesBuffer{

	constructor(){
		this.buffer = []
	}
	
	addUser(id){
		var index = this.buffer.findIndex(map => map[0] === id)
		if(index != -1){
			this.buffer.splice(index, 1)
		}
		this.buffer.push([id])
	}

	removeUser(id){
		var index = this.buffer.findIndex(map => map[0] === id)
		if(index != -1){
			this.buffer.splice(index, 1)
		}
	}

	addMessage(id, message){
		var index = this.buffer.findIndex(map => map[0] === id)
		if(index != -1){
			this.buffer[index].push(message)
		}
	}

	addMessage(message){
		for(var i = 0; i < this.buffer.length; ++i){
			this.buffer[i].push(message)
		}
	}

	removeMessage(id, message){
		var indexI = this.buffer.findIndex(map => map[0] === id)
		if(indexI != -1){
			var indexM = this.buffer.findIndex(map => map[0] === id)
			if(indexM != -1){
				this.buffer[indexI].splice(indexM, 1)
			}
		}
	}

	length(){
		return this.buffer.length
	}


}

module.exports = messagesBuffer